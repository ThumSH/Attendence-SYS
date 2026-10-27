using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace AttendanceTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public EmployeesController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // GET: /api/employees
    // GET: /api/employees?search=RANIL
    // GET: /api/employees?department=002
    [HttpGet]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] string? search = null,
        [FromQuery] string? department = null)
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

        const string sql = @"
            SELECT
                e.Empno,

                CASE
                    WHEN NULLIF(LTRIM(RTRIM(e.FName)), '') IS NOT NULL
                        THEN LTRIM(RTRIM(e.FName))
                    ELSE LTRIM(RTRIM(e.IName))
                END AS EmployeeName,

                e.Department,
                d.Name AS DepartmentName,
                e.Shift,
                e.Status,
                e.Attendance

            FROM Employee e

            LEFT JOIN Department d
                ON LTRIM(RTRIM(d.Code)) =
                   LTRIM(RTRIM(e.Department))

            WHERE
                (
                    @Search IS NULL

                    OR LTRIM(RTRIM(e.Empno))
                        LIKE '%' + @Search + '%'

                    OR LTRIM(RTRIM(e.FName))
                        LIKE '%' + @Search + '%'

                    OR LTRIM(RTRIM(e.IName))
                        LIKE '%' + @Search + '%'
                )

                AND
                (
                    @Department IS NULL

                    OR LTRIM(RTRIM(e.Department))
                        = @Department
                )

            ORDER BY e.Empno;
        ";

        await using var command =
            new SqlCommand(sql, connection);

        var searchParam =
            command.Parameters.Add(
                "@Search",
                SqlDbType.VarChar,
                150
            );

        searchParam.Value =
            string.IsNullOrWhiteSpace(search)
                ? DBNull.Value
                : search.Trim();

        var departmentParam =
            command.Parameters.Add(
                "@Department",
                SqlDbType.VarChar,
                10
            );

        departmentParam.Value =
            string.IsNullOrWhiteSpace(department)
                ? DBNull.Value
                : department.Trim();

        var employees = new List<object>();

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            employees.Add(new
            {
                empNo = GetString(reader, "Empno"),

                name = GetString(reader, "EmployeeName"),

                departmentCode =
                    GetString(reader, "Department"),

                department =
                    GetString(reader, "DepartmentName"),

                shift =
                    GetString(reader, "Shift"),

                status =
                    GetString(reader, "Status"),

                attendanceEnabled =
                    GetString(reader, "Attendance")
            });
        }

        return Ok(employees);
    }

    // GET: /api/employees/0061
    [HttpGet("{empNo}")]
    public async Task<IActionResult> GetEmployee(
        string empNo)
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

        const string sql = @"
            SELECT
                e.Empno,

                CASE
                    WHEN NULLIF(LTRIM(RTRIM(e.FName)), '') IS NOT NULL
                        THEN LTRIM(RTRIM(e.FName))
                    ELSE LTRIM(RTRIM(e.IName))
                END AS EmployeeName,

                e.Department,
                d.Name AS DepartmentName,
                e.Shift,
                e.Status,
                e.Attendance

            FROM Employee e

            LEFT JOIN Department d
                ON LTRIM(RTRIM(d.Code)) =
                   LTRIM(RTRIM(e.Department))

            WHERE LTRIM(RTRIM(e.Empno)) = @EmpNo;
        ";

        await using var command =
            new SqlCommand(sql, connection);

        var empParam =
            command.Parameters.Add(
                "@EmpNo",
                SqlDbType.VarChar,
                10
            );

        empParam.Value = empNo.Trim();

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return NotFound(new
            {
                message = "Employee not found."
            });
        }

        var employee = new
        {
            empNo = GetString(reader, "Empno"),

            name = GetString(reader, "EmployeeName"),

            departmentCode =
                GetString(reader, "Department"),

            department =
                GetString(reader, "DepartmentName"),

            shift =
                GetString(reader, "Shift"),

            status =
                GetString(reader, "Status"),

            attendanceEnabled =
                GetString(reader, "Attendance")
        };

        return Ok(employee);
    }

    private static string? GetString(
        SqlDataReader reader,
        string columnName)
    {
        var value = reader[columnName];

        if (value == DBNull.Value)
        {
            return null;
        }

        return value.ToString()?.Trim();
    }
}