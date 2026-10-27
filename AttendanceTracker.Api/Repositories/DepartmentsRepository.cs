using AttendanceTracker.Api.DTOs;
using Microsoft.Data.SqlClient;

namespace AttendanceTracker.Api.Repositories;

public sealed class DepartmentsRepository
{
    private readonly IConfiguration
        _configuration;

    public DepartmentsRepository(
        IConfiguration configuration)
    {
        _configuration =
            configuration;
    }

    public async Task<List<DepartmentDto>>
        GetDepartmentsAsync()
    {
        var connectionString =
            _configuration
                .GetConnectionString(
                    "AttendanceDb"
                );

        if (
            string.IsNullOrWhiteSpace(
                connectionString
            )
        )
        {
            throw new InvalidOperationException(
                "Database connection string is missing."
            );
        }

        await using var connection =
            new SqlConnection(
                connectionString
            );

        await connection
            .OpenAsync();

        const string sql = @"
            SELECT
                Code,
                Name
            FROM Department
            ORDER BY Name;
        ";

        await using var command =
            new SqlCommand(
                sql,
                connection
            );

        var departments =
            new List<DepartmentDto>();

        await using var reader =
            await command
                .ExecuteReaderAsync();

        while (
            await reader.ReadAsync()
        )
        {
            departments.Add(
                new DepartmentDto
                {
                    Code =
                        reader["Code"]
                            .ToString()
                            ?.Trim()
                        ?? string.Empty,

                    Name =
                        reader["Name"]
                            .ToString()
                            ?.Trim()
                        ?? string.Empty
                }
            );
        }

        return departments;
    }
}