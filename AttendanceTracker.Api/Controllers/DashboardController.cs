using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace AttendanceTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public DashboardController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // GET: /api/dashboard
    // GET: /api/dashboard?date=2026-10-10
    [HttpGet]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] DateTime? date = null)
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

        await using var connection =
            new SqlConnection(connectionString);

        await connection.OpenAsync();

        // -------------------------------------------------
        // 1. Determine dashboard date
        // -------------------------------------------------

        DateTime dashboardDate;

        if (date.HasValue)
        {
            dashboardDate = date.Value.Date;
        }
        else
        {
            const string latestDateSql = @"
                SELECT MAX(Date)
                FROM Attendance;
            ";

            await using var latestDateCommand =
                new SqlCommand(latestDateSql, connection);

            var result =
                await latestDateCommand.ExecuteScalarAsync();

            if (result == null || result == DBNull.Value)
            {
                return Ok(new
                {
                    message = "No attendance records found."
                });
            }

            dashboardDate =
                Convert.ToDateTime(result).Date;
        }

        // -------------------------------------------------
        // 2. Total employees
        // -------------------------------------------------

        const string employeeCountSql = @"
            SELECT COUNT(*)
            FROM Employee
            WHERE
                Attendance = 'Y'
                OR Attendance IS NULL
                OR LTRIM(RTRIM(Attendance)) = '';
        ";

        await using var employeeCountCommand =
            new SqlCommand(employeeCountSql, connection);

        var totalEmployees =
            Convert.ToInt32(
                await employeeCountCommand.ExecuteScalarAsync()
            );

        // -------------------------------------------------
        // 3. Attendance summary
        // -------------------------------------------------

        const string summarySql = @"
            SELECT
                COUNT(*) AS TotalRecords,

                SUM(
                    CASE
                        WHEN UPPER(LTRIM(RTRIM(EmpIn))) = 'AB'
                        THEN 1
                        ELSE 0
                    END
                ) AS Absent,

                SUM(
                    CASE
                        WHEN
                            EmpIn IS NOT NULL
                            AND LTRIM(RTRIM(EmpIn)) <> ''
                            AND UPPER(LTRIM(RTRIM(EmpIn))) <> 'AB'
                            AND UPPER(LTRIM(RTRIM(EmpIn))) <> 'SUNDAY'
                        THEN 1
                        ELSE 0
                    END
                ) AS Present,

                SUM(
                    CASE
                        WHEN
                            Late IS NOT NULL
                            AND LTRIM(RTRIM(Late)) <> ''
                            AND LTRIM(RTRIM(Late)) <> '0'
                        THEN 1
                        ELSE 0
                    END
                ) AS Late,

                SUM(
                    CASE
                        WHEN
                            (
                                EmpIn IS NULL
                                OR LTRIM(RTRIM(EmpIn)) = ''
                            )
                            AND
                            (
                                EmpOut IS NOT NULL
                                AND LTRIM(RTRIM(EmpOut)) <> ''
                            )
                        THEN 1
                        ELSE 0
                    END
                ) AS MissingCheckIn,

                SUM(
                    CASE
                        WHEN
                            (
                                EmpIn IS NOT NULL
                                AND LTRIM(RTRIM(EmpIn)) <> ''
                                AND UPPER(LTRIM(RTRIM(EmpIn))) <> 'AB'
                                AND UPPER(LTRIM(RTRIM(EmpIn))) <> 'SUNDAY'
                            )
                            AND
                            (
                                EmpOut IS NULL
                                OR LTRIM(RTRIM(EmpOut)) = ''
                            )
                        THEN 1
                        ELSE 0
                    END
                ) AS MissingCheckOut

            FROM Attendance

            WHERE
                Date >= @Date
                AND Date < DATEADD(DAY, 1, @Date);
        ";

        int present = 0;
        int absent = 0;
        int late = 0;
        int totalRecords = 0;
        int missingCheckIn = 0;
        int missingCheckOut = 0;

        await using (var summaryCommand =
                     new SqlCommand(summarySql, connection))
        {
            summaryCommand.Parameters.Add(
                "@Date",
                SqlDbType.DateTime
            ).Value = dashboardDate;

            await using var reader =
                await summaryCommand.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                totalRecords =
                    reader["TotalRecords"] == DBNull.Value
                        ? 0
                        : Convert.ToInt32(
                            reader["TotalRecords"]
                        );

                present =
                    reader["Present"] == DBNull.Value
                        ? 0
                        : Convert.ToInt32(
                            reader["Present"]
                        );

                absent =
                    reader["Absent"] == DBNull.Value
                        ? 0
                        : Convert.ToInt32(
                            reader["Absent"]
                        );

                late =
                    reader["Late"] == DBNull.Value
                        ? 0
                        : Convert.ToInt32(
                            reader["Late"]
                        );

                missingCheckIn =
                    reader["MissingCheckIn"] == DBNull.Value
                        ? 0
                        : Convert.ToInt32(
                            reader["MissingCheckIn"]
                        );

                missingCheckOut =
                    reader["MissingCheckOut"] == DBNull.Value
                        ? 0
                        : Convert.ToInt32(
                            reader["MissingCheckOut"]
                        );
            }
        }

        // -------------------------------------------------
        // 4. Attendance rows for selected date
        // -------------------------------------------------

        const string attendanceSql = @"
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
                a.Date >= @Date
                AND a.Date < DATEADD(DAY, 1, @Date)

            ORDER BY a.EmpNo;
        ";

        var attendance = new List<object>();

        await using (var attendanceCommand =
                     new SqlCommand(attendanceSql, connection))
        {
            attendanceCommand.Parameters.Add(
                "@Date",
                SqlDbType.DateTime
            ).Value = dashboardDate;

            await using var reader =
                await attendanceCommand.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                var timeIn =
                    GetString(reader, "EmpIn");

                var timeOut =
                    GetString(reader, "EmpOut");

                var lateValue =
                    GetString(reader, "Late");

                var status =
                    GetAttendanceStatus(
                        timeIn,
                        timeOut,
                        lateValue
                    );

                attendance.Add(new
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

                    late = lateValue,

                    early =
                        GetString(
                            reader,
                            "Early"
                        ),

                    ot =
                        GetString(
                            reader,
                            "Ot"
                        ),

                    status
                });
            }
        }

        // -------------------------------------------------
        // 5. Department summary
        // -------------------------------------------------

        const string departmentSql = @"
            SELECT
                e.Department AS DepartmentCode,

                d.Name AS DepartmentName,

                COUNT(*) AS Total,

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
                ) AS Present,

                SUM(
                    CASE
                        WHEN
                            UPPER(LTRIM(RTRIM(a.EmpIn))) = 'AB'
                        THEN 1
                        ELSE 0
                    END
                ) AS Absent,

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
                a.Date >= @Date
                AND a.Date < DATEADD(DAY, 1, @Date)

            GROUP BY
                e.Department,
                d.Name

            ORDER BY
                d.Name;
        ";

        var departments = new List<object>();

        await using (var departmentCommand =
                     new SqlCommand(departmentSql, connection))
        {
            departmentCommand.Parameters.Add(
                "@Date",
                SqlDbType.DateTime
            ).Value = dashboardDate;

            await using var reader =
                await departmentCommand.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                departments.Add(new
                {
                    code =
                        GetString(
                            reader,
                            "DepartmentCode"
                        ),

                    name =
                        GetString(
                            reader,
                            "DepartmentName"
                        ),

                    total =
                        Convert.ToInt32(
                            reader["Total"]
                        ),

                    present =
                        reader["Present"] == DBNull.Value
                            ? 0
                            : Convert.ToInt32(
                                reader["Present"]
                            ),

                    absent =
                        reader["Absent"] == DBNull.Value
                            ? 0
                            : Convert.ToInt32(
                                reader["Absent"]
                            ),

                    missingCheckIn =
                        reader["MissingCheckIn"] == DBNull.Value
                            ? 0
                            : Convert.ToInt32(
                                reader["MissingCheckIn"]
                            ),

                    missingCheckOut =
                        reader["MissingCheckOut"] == DBNull.Value
                            ? 0
                            : Convert.ToInt32(
                                reader["MissingCheckOut"]
                            )
                });
            }
        }

        // -------------------------------------------------
        // 6. Final response
        // -------------------------------------------------

        return Ok(new
        {
            date =
                dashboardDate.ToString(
                    "yyyy-MM-dd"
                ),

            summary = new
            {
                totalEmployees,

                attendanceRecords =
                    totalRecords,

                present,

                absent,

                late,

                missingCheckIn,

                missingCheckOut
            },

            departments,

            attendance
        });
    }

    // -------------------------------------------------
    // Helpers
    // -------------------------------------------------

    private static string? GetString(
        SqlDataReader reader,
        string columnName)
    {
        var value = reader[columnName];

        if (value == DBNull.Value)
        {
            return null;
        }

        return value
            .ToString()
            ?.Trim();
    }

    private static string GetAttendanceStatus(
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

        // Sunday
        if (
            string.Equals(
                cleanTimeIn,
                "Sunday",
                StringComparison.OrdinalIgnoreCase
            )
        )
        {
            return "Sunday";
        }

        // Absent
        if (
            string.Equals(
                cleanTimeIn,
                "AB",
                StringComparison.OrdinalIgnoreCase
            )
        )
        {
            return "Absent";
        }

        // Employee has checkout but no check-in
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

        // Employee has check-in but no checkout
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

        // Late
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

        // Normal attendance
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
}