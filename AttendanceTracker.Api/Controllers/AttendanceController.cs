using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace AttendanceTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public AttendanceController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet("{empNo}")]
    public async Task<IActionResult> GetAttendance(
        string empNo,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        if (from > to)
        {
            return BadRequest(new
            {
                message = "'from' date cannot be after 'to' date."
            });
        }

        var connectionString =
            _configuration.GetConnectionString("AttendanceDb");

        await using var connection =
            new SqlConnection(connectionString);

        await connection.OpenAsync();

        // -----------------------------
        // 1. Employee information
        // -----------------------------

        const string employeeSql = @"
            SELECT
                e.Empno,
                e.FName,
                e.Department,
                d.Name AS DepartmentName,
                e.Shift
            FROM Employee e
            LEFT JOIN Department d
                ON d.Code = e.Department
            WHERE e.Empno = @EmpNo;
        ";

        object? employee = null;

        await using (var employeeCommand =
                     new SqlCommand(employeeSql, connection))
        {
            employeeCommand.Parameters.AddWithValue("@EmpNo", empNo);

            await using var reader =
                await employeeCommand.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return NotFound(new
                {
                    message = "Employee not found"
                });
            }

            employee = new
            {
                empNo = reader["Empno"]?.ToString(),
                name = reader["FName"]?.ToString(),
                departmentCode = reader["Department"]?.ToString(),
                department = reader["DepartmentName"]?.ToString(),
                shift = reader["Shift"]?.ToString(),
                dateFrom = from.ToString("yyyy-MM-dd"),
                dateTo = to.ToString("yyyy-MM-dd")
            };
        }

        // -----------------------------
        // 2. Attendance rows
        // -----------------------------

        const string attendanceSql = @"
            SELECT
                Date,
                Shiftin,
                EmpIn,
                ShiftOut,
                EmpOut,
                Late,
                Early,
                Ot,
                Abs,
                status
            FROM Attendance
            WHERE EmpNo = @EmpNo
              AND Date >= @DateFrom
              AND Date < DATEADD(DAY, 1, @DateTo)
            ORDER BY Date;
        ";

        var attendance = new List<object>();

        await using (var attendanceCommand =
                     new SqlCommand(attendanceSql, connection))
        {
            attendanceCommand.Parameters.AddWithValue("@EmpNo", empNo);
            attendanceCommand.Parameters.AddWithValue("@DateFrom", from.Date);
            attendanceCommand.Parameters.AddWithValue("@DateTo", to.Date);

            await using var reader =
                await attendanceCommand.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                attendance.Add(new
                {
                    date = Convert.ToDateTime(reader["Date"])
                        .ToString("yyyy-MM-dd"),

                    shiftIn = DbValue(reader["Shiftin"]),
                    timeIn = DbValue(reader["EmpIn"]),
                    shiftOut = DbValue(reader["ShiftOut"]),
                    timeOut = DbValue(reader["EmpOut"]),
                    late = DbValue(reader["Late"]),
                    early = DbValue(reader["Early"]),
                    ot = DbValue(reader["Ot"]),
                    abs = DbValue(reader["Abs"]),
                    status = DbValue(reader["status"])
                });
            }
        }

        // -----------------------------
        // 3. Totals
        // -----------------------------

        const string totalsSql = @"
            SELECT
                SUM(
                    CASE
                        WHEN Late IS NULL
                             OR Late = ''
                             OR Late = '0'
                        THEN 0
                        ELSE DATEDIFF(
                            MINUTE,
                            CAST('00:00' AS TIME),
                            TRY_CAST(Late AS TIME)
                        )
                    END
                ) AS LateMinutes,

                SUM(
                    CASE
                        WHEN Early IS NULL
                             OR Early = ''
                             OR Early = '0'
                        THEN 0
                        ELSE DATEDIFF(
                            MINUTE,
                            CAST('00:00' AS TIME),
                            TRY_CAST(Early AS TIME)
                        )
                    END
                ) AS EarlyMinutes,

                SUM(
                    CASE
                        WHEN Ot IS NULL
                             OR Ot = ''
                             OR Ot = '0'
                        THEN 0
                        ELSE DATEDIFF(
                            MINUTE,
                            CAST('00:00' AS TIME),
                            TRY_CAST(Ot AS TIME)
                        )
                    END
                ) AS OTMinutes

            FROM Attendance

            WHERE EmpNo = @EmpNo
              AND Date >= @DateFrom
              AND Date < DATEADD(DAY, 1, @DateTo);
        ";

        var lateMinutes = 0;
        var earlyMinutes = 0;
        var otMinutes = 0;

        await using (var totalsCommand =
                     new SqlCommand(totalsSql, connection))
        {
            totalsCommand.Parameters.AddWithValue("@EmpNo", empNo);
            totalsCommand.Parameters.AddWithValue("@DateFrom", from.Date);
            totalsCommand.Parameters.AddWithValue("@DateTo", to.Date);

            await using var reader =
                await totalsCommand.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                lateMinutes =
                    reader["LateMinutes"] == DBNull.Value
                        ? 0
                        : Convert.ToInt32(reader["LateMinutes"]);

                earlyMinutes =
                    reader["EarlyMinutes"] == DBNull.Value
                        ? 0
                        : Convert.ToInt32(reader["EarlyMinutes"]);

                otMinutes =
                    reader["OTMinutes"] == DBNull.Value
                        ? 0
                        : Convert.ToInt32(reader["OTMinutes"]);
            }
        }

        var result = new
        {
            employee,

            attendance,

            totals = new
            {
                lateMinutes,
                earlyMinutes,
                otMinutes,

                totalLate = FormatMinutes(lateMinutes),
                totalEarly = FormatMinutes(earlyMinutes),
                totalOT = FormatMinutes(otMinutes)
            }
        };

        return Ok(result);
    }

    private static string? DbValue(object value)
    {
        return value == DBNull.Value
            ? null
            : value.ToString();
    }

    private static string FormatMinutes(int minutes)
    {
        var hours = minutes / 60;
        var mins = minutes % 60;

        return $"{hours}:{mins:D2}";
    }
}