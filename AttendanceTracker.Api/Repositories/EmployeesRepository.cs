using AttendanceTracker.Api.DTOs;
using Microsoft.Data.SqlClient;
using System.Data;

namespace AttendanceTracker.Api.Repositories;

public sealed class EmployeesRepository
{
    private readonly IConfiguration
        _configuration;

    public EmployeesRepository(
        IConfiguration configuration)
    {
        _configuration =
            configuration;
    }

    public async Task<List<EmployeeDto>>
        GetEmployeesAsync(
            string? search,
            string? department)
    {
        await using var connection =
            await OpenConnectionAsync();

        const string sql = @"
            SELECT
                e.Empno,

                CASE
                    WHEN NULLIF(
                        LTRIM(RTRIM(e.FName)),
                        ''
                    ) IS NOT NULL
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
                ON LTRIM(RTRIM(d.Code))
                   =
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
                        =
                        @Department
                )

            ORDER BY e.Empno;
        ";

        await using var command =
            new SqlCommand(
                sql,
                connection
            );

        command.Parameters.Add(
            "@Search",
            SqlDbType.VarChar,
            150
        ).Value =
            string.IsNullOrWhiteSpace(
                search
            )
                ? DBNull.Value
                : search.Trim();

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

        var employees =
            new List<EmployeeDto>();

        await using var reader =
            await command
                .ExecuteReaderAsync();

        while (
            await reader.ReadAsync()
        )
        {
            employees.Add(
                MapEmployee(reader)
            );
        }

        return employees;
    }

    public async Task<EmployeeDto?>
        GetEmployeeAsync(
            string empNo)
    {
        await using var connection =
            await OpenConnectionAsync();

        const string sql = @"
            SELECT
                e.Empno,

                CASE
                    WHEN NULLIF(
                        LTRIM(RTRIM(e.FName)),
                        ''
                    ) IS NOT NULL
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
                ON LTRIM(RTRIM(d.Code))
                   =
                   LTRIM(RTRIM(e.Department))

            WHERE
                LTRIM(RTRIM(e.Empno))
                =
                @EmpNo;
        ";

        await using var command =
            new SqlCommand(
                sql,
                connection
            );

        command.Parameters.Add(
            "@EmpNo",
            SqlDbType.VarChar,
            10
        ).Value =
            empNo.Trim();

        await using var reader =
            await command
                .ExecuteReaderAsync();

        if (
            !await reader.ReadAsync()
        )
        {
            return null;
        }

        return MapEmployee(
            reader
        );
    }

    private async Task<SqlConnection>
        OpenConnectionAsync()
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

        var connection =
            new SqlConnection(
                connectionString
            );

        await connection
            .OpenAsync();

        return connection;
    }

    private static EmployeeDto
        MapEmployee(
            SqlDataReader reader)
    {
        return new EmployeeDto
        {
            EmpNo =
                GetString(
                    reader,
                    "Empno"
                ) ?? string.Empty,

            Name =
                GetString(
                    reader,
                    "EmployeeName"
                ) ?? string.Empty,

            DepartmentCode =
                GetString(
                    reader,
                    "Department"
                ),

            Department =
                GetString(
                    reader,
                    "DepartmentName"
                ),

            Shift =
                GetString(
                    reader,
                    "Shift"
                ),

            Status =
                GetString(
                    reader,
                    "Status"
                ),

            AttendanceEnabled =
                GetString(
                    reader,
                    "Attendance"
                )
        };
    }

    private static string?
        GetString(
            SqlDataReader reader,
            string columnName)
    {
        var value =
            reader[columnName];

        if (
            value == DBNull.Value
        )
        {
            return null;
        }

        return value
            .ToString()
            ?.Trim();
    }
}