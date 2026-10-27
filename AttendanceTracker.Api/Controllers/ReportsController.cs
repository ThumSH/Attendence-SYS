using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace AttendanceTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public ReportsController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // Examples:
    //
    // GET /api/reports?type=daily&from=2026-09-24&to=2026-09-24
    // GET /api/reports?type=late&from=2026-09-01&to=2026-09-30
    // GET /api/reports?type=absent&from=2026-09-01&to=2026-09-30
    // GET /api/reports?type=missing&from=2026-09-01&to=2026-09-30
    // GET /api/reports?type=ot&from=2026-09-01&to=2026-09-30
    // GET /api/reports?type=monthly&from=2026-09-01&to=2026-09-30
    //
    // Optional:
    // &department=002
    // &empNo=0061

    [HttpGet]
    public async Task<IActionResult> GetReport(
        [FromQuery] string type = "daily",
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? department = null,
        [FromQuery] string? empNo = null)
    {
        var connectionString =
            _configuration.GetConnectionString("AttendanceDb");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return StatusCode(500, new
            {
                message = "Database connection string is missing."
            });
        }

        type = type.Trim().ToLowerInvariant();

        var supportedTypes = new[]
        {
            "daily",
            "monthly",
            "late",
            "absent",
            "missing",
            "ot"
        };

        if (!supportedTypes.Contains(type))
        {
            return BadRequest(new
            {
                message = "Invalid report type."
            });
        }

        await using var connection =
            new SqlConnection(connectionString);

        await connection.OpenAsync();

        // -------------------------------------------------
        // Determine date range
        // -------------------------------------------------

        DateTime dateFrom;
        DateTime dateTo;

        if (from.HasValue && to.HasValue)
        {
            dateFrom = from.Value.Date;
            dateTo = to.Value.Date;
        }
        else
        {
            const string latestSql = @"
                SELECT MAX(Date)
                FROM Attendance;
            ";

            await using var latestCommand =
                new SqlCommand(latestSql, connection);

            var latest =
                await latestCommand.ExecuteScalarAsync();

            if (latest == null || latest == DBNull.Value)
            {
                return Ok(new
                {
                    type,
                    rows = Array.Empty<object>()
                });
            }

            var latestDate =
                Convert.ToDateTime(latest).Date;

            dateFrom = latestDate;
            dateTo = latestDate;
        }

        if (dateFrom > dateTo)
        {
            return BadRequest(new
            {
                message = "From date cannot be after To date."
            });
        }

        // -------------------------------------------------
        // Monthly report has its own aggregate query
        // -------------------------------------------------

        if (type == "monthly")
        {
            return await GetMonthlyReport(
                connection,
                dateFrom,
                dateTo,
                department,
                empNo
            );
        }

        // -------------------------------------------------
        // Detail-based reports
        // -------------------------------------------------

        var sql = @"
            SELECT
                a.EmpNo,
                a.Date,

                CASE
                    WHEN
                        NULLIF(
                            LTRIM(RTRIM(e.FName)),
                            ''
                        ) IS NOT NULL
                    THEN LTRIM(RTRIM(e.FName))
                    ELSE LTRIM(RTRIM(e.IName))
                END AS EmployeeName,

                e.Department,
                d.Name AS DepartmentName,

                a.Shiftin,
                a.EmpIn,
                a.ShiftOut,
                a.EmpOut,
                a.Late,
                a.Early,
                a.Ot

            FROM Attendance a

            LEFT JOIN Employee e
                ON LTRIM(RTRIM(e.Empno))
                   =
                   LTRIM(RTRIM(a.EmpNo))

            LEFT JOIN Department d
                ON LTRIM(RTRIM(d.Code))
                   =
                   LTRIM(RTRIM(e.Department))

            WHERE
                a.Date >= @DateFrom
                AND a.Date < DATEADD(DAY, 1, @DateTo)

                AND (
                    @Department IS NULL
                    OR LTRIM(RTRIM(e.Department))
                       =
                       @Department
                )

                AND (
                    @EmpNo IS NULL
                    OR LTRIM(RTRIM(a.EmpNo))
                       =
                       @EmpNo
                )
        ";

        sql += type switch
        {
            "late" => @"
                AND
                    a.Late IS NOT NULL
                AND LTRIM(RTRIM(a.Late)) <> ''
                AND LTRIM(RTRIM(a.Late)) <> '0'
            ",

            "absent" => @"
                AND UPPER(LTRIM(RTRIM(a.EmpIn))) = 'AB'
            ",

            "missing" => @"
                AND
                (
                    (
                        (
                            a.EmpIn IS NULL
                            OR LTRIM(RTRIM(a.EmpIn)) = ''
                        )
                        AND
                        (
                            a.EmpOut IS NOT NULL
                            AND LTRIM(RTRIM(a.EmpOut)) <> ''
                        )
                    )

                    OR

                    (
                        (
                            a.EmpIn IS NOT NULL
                            AND LTRIM(RTRIM(a.EmpIn)) <> ''
                            AND UPPER(LTRIM(RTRIM(a.EmpIn))) <> 'AB'
                            AND UPPER(LTRIM(RTRIM(a.EmpIn))) <> 'SUNDAY'
                        )
                        AND
                        (
                            a.EmpOut IS NULL
                            OR LTRIM(RTRIM(a.EmpOut)) = ''
                        )
                    )
                )
            ",

            "ot" => @"
                AND
                    a.Ot IS NOT NULL
                AND LTRIM(RTRIM(a.Ot)) <> ''
                AND LTRIM(RTRIM(a.Ot)) <> '0'
            ",

            _ => ""
        };

        sql += @"
            ORDER BY
                a.Date,
                a.EmpNo;
        ";

        await using var command =
            new SqlCommand(sql, connection);

        AddCommonParameters(
            command,
            dateFrom,
            dateTo,
            department,
            empNo
        );

        var rows = new List<object>();

        var totalLateMinutes = 0;
        var totalEarlyMinutes = 0;
        var totalOtMinutes = 0;

        var presentCount = 0;
        var absentCount = 0;
        var lateCount = 0;
        var missingCheckInCount = 0;
        var missingCheckOutCount = 0;

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            var timeIn =
                GetString(reader, "EmpIn");

            var timeOut =
                GetString(reader, "EmpOut");

            var late =
                GetString(reader, "Late");

            var early =
                GetString(reader, "Early");

            var ot =
                GetString(reader, "Ot");

            var status =
                GetAttendanceStatus(
                    timeIn,
                    timeOut,
                    late
                );

            switch (status)
            {
                case "Present":
                    presentCount++;
                    break;

                case "Late":
                    presentCount++;
                    lateCount++;
                    break;

                case "Absent":
                    absentCount++;
                    break;

                case "Missing Check-In":
                    missingCheckInCount++;
                    break;

                case "Missing Check-Out":
                    presentCount++;
                    missingCheckOutCount++;
                    break;
            }

            totalLateMinutes +=
                ParseMinutes(late);

            totalEarlyMinutes +=
                ParseMinutes(early);

            totalOtMinutes +=
                ParseMinutes(ot);

            rows.Add(new
            {
                empNo =
                    GetString(reader, "EmpNo"),

                name =
                    GetString(
                        reader,
                        "EmployeeName"
                    ),

                departmentCode =
                    GetString(
                        reader,
                        "Department"
                    ),

                department =
                    GetString(
                        reader,
                        "DepartmentName"
                    ),

                date =
                    Convert
                        .ToDateTime(
                            reader["Date"]
                        )
                        .ToString(
                            "yyyy-MM-dd"
                        ),

                shiftIn =
                    GetString(
                        reader,
                        "Shiftin"
                    ),

                timeIn,

                shiftOut =
                    GetString(
                        reader,
                        "ShiftOut"
                    ),

                timeOut,

                late,

                early,

                ot,

                status
            });
        }

        return Ok(new
        {
            type,

            dateFrom =
                dateFrom.ToString(
                    "yyyy-MM-dd"
                ),

            dateTo =
                dateTo.ToString(
                    "yyyy-MM-dd"
                ),

            filters = new
            {
                department,
                empNo
            },

            summary = new
            {
                recordCount =
                    rows.Count,

                present =
                    presentCount,

                absent =
                    absentCount,

                late =
                    lateCount,

                missingCheckIn =
                    missingCheckInCount,

                missingCheckOut =
                    missingCheckOutCount,

                totalLateMinutes,

                totalEarlyMinutes,

                totalOtMinutes,

                totalLate =
                    FormatMinutes(
                        totalLateMinutes
                    ),

                totalEarly =
                    FormatMinutes(
                        totalEarlyMinutes
                    ),

                totalOT =
                    FormatMinutes(
                        totalOtMinutes
                    )
            },

            rows
        });
    }

    // -------------------------------------------------
    // MONTHLY REPORT
    // -------------------------------------------------

    private async Task<IActionResult>
        GetMonthlyReport(
            SqlConnection connection,
            DateTime dateFrom,
            DateTime dateTo,
            string? department,
            string? empNo)
    {
        const string sql = @"
            SELECT
                a.EmpNo,

                CASE
                    WHEN
                        NULLIF(
                            LTRIM(RTRIM(e.FName)),
                            ''
                        ) IS NOT NULL
                    THEN LTRIM(RTRIM(e.FName))
                    ELSE LTRIM(RTRIM(e.IName))
                END AS EmployeeName,

                e.Department,
                d.Name AS DepartmentName,

                COUNT(*) AS TotalRows,

                SUM(
                    CASE
                        WHEN
                            a.EmpIn IS NOT NULL
                            AND LTRIM(RTRIM(a.EmpIn)) <> ''
                            AND UPPER(LTRIM(RTRIM(a.EmpIn))) <> 'AB'
                            AND UPPER(LTRIM(RTRIM(a.EmpIn))) <> 'SUNDAY'
                        THEN 1
                        ELSE 0
                    END
                ) AS PresentDays,

                SUM(
                    CASE
                        WHEN
                            UPPER(
                                LTRIM(
                                    RTRIM(a.EmpIn)
                                )
                            ) = 'AB'
                        THEN 1
                        ELSE 0
                    END
                ) AS AbsentDays,

                SUM(
                    CASE
                        WHEN
                            a.Late IS NOT NULL
                            AND LTRIM(RTRIM(a.Late)) <> ''
                            AND LTRIM(RTRIM(a.Late)) <> '0'
                        THEN 1
                        ELSE 0
                    END
                ) AS LateDays,

                SUM(
                    CASE
                        WHEN
                            (
                                a.EmpIn IS NULL
                                OR LTRIM(RTRIM(a.EmpIn)) = ''
                            )
                            AND
                            (
                                a.EmpOut IS NOT NULL
                                AND LTRIM(RTRIM(a.EmpOut)) <> ''
                            )
                        THEN 1
                        ELSE 0
                    END
                ) AS MissingCheckIn,

                SUM(
                    CASE
                        WHEN
                            (
                                a.EmpIn IS NOT NULL
                                AND LTRIM(RTRIM(a.EmpIn)) <> ''
                                AND UPPER(LTRIM(RTRIM(a.EmpIn))) <> 'AB'
                                AND UPPER(LTRIM(RTRIM(a.EmpIn))) <> 'SUNDAY'
                            )
                            AND
                            (
                                a.EmpOut IS NULL
                                OR LTRIM(RTRIM(a.EmpOut)) = ''
                            )
                        THEN 1
                        ELSE 0
                    END
                ) AS MissingCheckOut

            FROM Attendance a

            LEFT JOIN Employee e
                ON LTRIM(RTRIM(e.Empno))
                   =
                   LTRIM(RTRIM(a.EmpNo))

            LEFT JOIN Department d
                ON LTRIM(RTRIM(d.Code))
                   =
                   LTRIM(RTRIM(e.Department))

            WHERE
                a.Date >= @DateFrom
                AND a.Date < DATEADD(DAY, 1, @DateTo)

                AND
                (
                    @Department IS NULL
                    OR LTRIM(RTRIM(e.Department))
                       =
                       @Department
                )

                AND
                (
                    @EmpNo IS NULL
                    OR LTRIM(RTRIM(a.EmpNo))
                       =
                       @EmpNo
                )

            GROUP BY
                a.EmpNo,
                e.FName,
                e.IName,
                e.Department,
                d.Name

            ORDER BY
                a.EmpNo;
        ";

        await using var command =
            new SqlCommand(sql, connection);

        AddCommonParameters(
            command,
            dateFrom,
            dateTo,
            department,
            empNo
        );

        var employees =
            new List<object>();

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            employees.Add(new
            {
                empNo =
                    GetString(
                        reader,
                        "EmpNo"
                    ),

                name =
                    GetString(
                        reader,
                        "EmployeeName"
                    ),

                departmentCode =
                    GetString(
                        reader,
                        "Department"
                    ),

                department =
                    GetString(
                        reader,
                        "DepartmentName"
                    ),

                totalRows =
                    ToInt(
                        reader,
                        "TotalRows"
                    ),

                presentDays =
                    ToInt(
                        reader,
                        "PresentDays"
                    ),

                absentDays =
                    ToInt(
                        reader,
                        "AbsentDays"
                    ),

                lateDays =
                    ToInt(
                        reader,
                        "LateDays"
                    ),

                missingCheckIn =
                    ToInt(
                        reader,
                        "MissingCheckIn"
                    ),

                missingCheckOut =
                    ToInt(
                        reader,
                        "MissingCheckOut"
                    )
            });
        }

        return Ok(new
        {
            type = "monthly",

            dateFrom =
                dateFrom.ToString(
                    "yyyy-MM-dd"
                ),

            dateTo =
                dateTo.ToString(
                    "yyyy-MM-dd"
                ),

            filters = new
            {
                department,
                empNo
            },

            summary = new
            {
                employeeCount =
                    employees.Count
            },

            rows =
                employees
        });
    }

    // -------------------------------------------------
    // COMMON SQL PARAMETERS
    // -------------------------------------------------

    private static void AddCommonParameters(
        SqlCommand command,
        DateTime dateFrom,
        DateTime dateTo,
        string? department,
        string? empNo)
    {
        command.Parameters.Add(
            "@DateFrom",
            SqlDbType.DateTime
        ).Value = dateFrom;

        command.Parameters.Add(
            "@DateTo",
            SqlDbType.DateTime
        ).Value = dateTo;

        command.Parameters.Add(
            "@Department",
            SqlDbType.VarChar,
            10
        ).Value =
            string.IsNullOrWhiteSpace(
                department
            )
                ? DBNull.Value
                : department.Trim();

        command.Parameters.Add(
            "@EmpNo",
            SqlDbType.VarChar,
            10
        ).Value =
            string.IsNullOrWhiteSpace(
                empNo
            )
                ? DBNull.Value
                : empNo.Trim();
    }

    // -------------------------------------------------
    // STATUS
    // -------------------------------------------------

    private static string
        GetAttendanceStatus(
            string? timeIn,
            string? timeOut,
            string? late)
    {
        var cleanTimeIn =
            timeIn?.Trim();

        var cleanTimeOut =
            timeOut?.Trim();

        var cleanLate =
            late?.Trim();

        if (
            string.Equals(
                cleanTimeIn,
                "Sunday",
                StringComparison
                    .OrdinalIgnoreCase
            )
        )
        {
            return "Sunday";
        }

        if (
            string.Equals(
                cleanTimeIn,
                "AB",
                StringComparison
                    .OrdinalIgnoreCase
            )
        )
        {
            return "Absent";
        }

        if (
            string.IsNullOrWhiteSpace(
                cleanTimeIn
            )
            &&
            !string.IsNullOrWhiteSpace(
                cleanTimeOut
            )
        )
        {
            return "Missing Check-In";
        }

        if (
            !string.IsNullOrWhiteSpace(
                cleanTimeIn
            )
            &&
            string.IsNullOrWhiteSpace(
                cleanTimeOut
            )
        )
        {
            return "Missing Check-Out";
        }

        if (
            !string.IsNullOrWhiteSpace(
                cleanLate
            )
            &&
            cleanLate != "0"
        )
        {
            return "Late";
        }

        if (
            !string.IsNullOrWhiteSpace(
                cleanTimeIn
            )
        )
        {
            return "Present";
        }

        return "No Record";
    }

    // -------------------------------------------------
    // HELPERS
    // -------------------------------------------------

    private static string? GetString(
        SqlDataReader reader,
        string columnName)
    {
        var value =
            reader[columnName];

        if (value == DBNull.Value)
        {
            return null;
        }

        return value
            .ToString()
            ?.Trim();
    }

    private static int ToInt(
        SqlDataReader reader,
        string columnName)
    {
        return
            reader[columnName] ==
            DBNull.Value
                ? 0
                : Convert.ToInt32(
                    reader[columnName]
                );
    }

    private static int ParseMinutes(
        string? value)
    {
        if (
            string.IsNullOrWhiteSpace(
                value
            )
            ||
            value == "0"
        )
        {
            return 0;
        }

        var parts =
            value.Split(':');

        if (
            parts.Length != 2
            ||
            !int.TryParse(
                parts[0],
                out var hours
            )
            ||
            !int.TryParse(
                parts[1],
                out var minutes
            )
        )
        {
            return 0;
        }

        return
            (hours * 60)
            + minutes;
    }

    private static string FormatMinutes(
        int totalMinutes)
    {
        var hours =
            totalMinutes / 60;

        var minutes =
            totalMinutes % 60;

        return
            $"{hours}:{minutes:D2}";
    }
}