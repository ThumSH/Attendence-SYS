using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace AttendanceTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public DepartmentsController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // GET: /api/departments
    [HttpGet]
    public async Task<IActionResult> GetDepartments()
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
                Code,
                Name
            FROM Department
            WHERE Code IS NOT NULL
            ORDER BY Name;
        ";

        await using var command =
            new SqlCommand(sql, connection);

        var departments = new List<object>();

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            departments.Add(new
            {
                code = reader["Code"] == DBNull.Value
                    ? null
                    : reader["Code"].ToString()?.Trim(),

                name = reader["Name"] == DBNull.Value
                    ? null
                    : reader["Name"].ToString()?.Trim()
            });
        }

        return Ok(departments);
    }
}