using AttendanceTracker.Api.DTOs;
using Microsoft.Data.SqlClient;
using System.Data;

namespace AttendanceTracker.Api.Repositories;

public sealed class DashboardRepository
{
    private readonly IConfiguration
        _configuration;

    public DashboardRepository(
        IConfiguration configuration)
    {
        _configuration =
            configuration;
    }

    public async Task<DateTime?>
        GetLatestAttendanceDateAsync()
    {
        await using var connection =
            await OpenConnectionAsync();

        const string sql = @"
            SELECT MAX(Date)
            FROM Attendance;
        ";

        await using var command =
            new SqlCommand(
                sql,
                connection
            );

        var result =
            await command
                .ExecuteScalarAsync();

        if (
            result is null
            ||
            result == DBNull.Value
        )
        {
            return null;
        }

        return Convert
            .ToDateTime(result)
            .Date;
    }

    public async Task<int>
        GetTotalEmployeesAsync()
    {
        await using var connection =
            await OpenConnectionAsync();

        const string sql = @"
            SELECT COUNT(*)
            FROM Employee
            WHERE
                Attendance = 'Y'
                OR Attendance IS NULL
                OR LTRIM(RTRIM(Attendance)) = '';
        ";

        await using var command =
            new SqlCommand(
                sql,
                connection
            );

        return Convert.ToInt32(
            await command
                .ExecuteScalarAsync()
        );
    }

    public async Task<
        List<DashboardAttendanceRowDto>>
        GetAttendanceRowsAsync(
            DateTime date)
    {
        await using var connection =
            await OpenConnectionAsync();

        const string sql = @"
            SELECT
                a.EmpNo,

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
                AND a.Date <
                    DATEADD(
                        DAY,
                        1,
                        @Date
                    )

            ORDER BY a.EmpNo;
        ";

        await using var command =
            new SqlCommand(
                sql,
                connection
            );

        command.Parameters.Add(
            "@Date",
            SqlDbType.DateTime
        ).Value = date.Date;

        var rows =
            new List<
                DashboardAttendanceRowDto>();

        await using var reader =
            await command
                .ExecuteReaderAsync();

        while (
            await reader.ReadAsync()
        )
        {
            rows.Add(
                new DashboardAttendanceRowDto
                {
                    EmpNo =
                        GetString(
                            reader,
                            "EmpNo"
                        ),

                    Name =
                        GetString(
                            reader,
                            "EmployeeName"
                        ),

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

                    ShiftIn =
                        GetString(
                            reader,
                            "Shiftin"
                        ),

                    TimeIn =
                        GetString(
                            reader,
                            "EmpIn"
                        ),

                    ShiftOut =
                        GetString(
                            reader,
                            "ShiftOut"
                        ),

                    TimeOut =
                        GetString(
                            reader,
                            "EmpOut"
                        ),

                    Late =
                        GetString(
                            reader,
                            "Late"
                        ),

                    Early =
                        GetString(
                            reader,
                            "Early"
                        ),

                    Ot =
                        GetString(
                            reader,
                            "Ot"
                        )
                }
            );
        }

        return rows;
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