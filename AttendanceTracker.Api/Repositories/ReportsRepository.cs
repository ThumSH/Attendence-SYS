using AttendanceTracker.Api.DTOs;
using Microsoft.Data.SqlClient;
using System.Data;

namespace AttendanceTracker.Api.Repositories;

public sealed class ReportsRepository
{
    private readonly IConfiguration
        _configuration;

    public ReportsRepository(
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

    public async Task<
        List<ReportRowDto>>
        GetDetailRowsAsync(
            DateTime dateFrom,
            DateTime dateTo,
            string? department,
            string? empNo)
    {
        await using var connection =
            await OpenConnectionAsync();

        const string sql = @"
            SELECT
                a.EmpNo,
                a.Date,

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
                a.Date >= @DateFrom

                AND a.Date <
                    DATEADD(
                        DAY,
                        1,
                        @DateTo
                    )

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

            ORDER BY
                a.Date,
                a.EmpNo;
        ";

        await using var command =
            new SqlCommand(
                sql,
                connection
            );

        AddCommonParameters(
            command,
            dateFrom,
            dateTo,
            department,
            empNo
        );

        var rows =
            new List<ReportRowDto>();

        await using var reader =
            await command
                .ExecuteReaderAsync();

        while (
            await reader.ReadAsync()
        )
        {
            rows.Add(
                new ReportRowDto
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

                    Date =
                        Convert
                            .ToDateTime(
                                reader["Date"]
                            )
                            .ToString(
                                "yyyy-MM-dd"
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

    public async Task<
        List<MonthlyReportRowDto>>
        GetMonthlyRowsAsync(
            DateTime dateFrom,
            DateTime dateTo,
            string? department,
            string? empNo)
    {
        var detailRows =
            await GetDetailRowsAsync(
                dateFrom,
                dateTo,
                department,
                empNo
            );

        return detailRows
            .GroupBy(
                row => new
                {
                    row.EmpNo,
                    row.Name,
                    row.DepartmentCode,
                    row.Department
                }
            )
            .Select(
                group =>
                    new MonthlyReportRowDto
                    {
                        EmpNo =
                            group.Key.EmpNo,

                        Name =
                            group.Key.Name,

                        DepartmentCode =
                            group.Key.DepartmentCode,

                        Department =
                            group.Key.Department,

                        TotalRows =
                            group.Count()
                    }
            )
            .OrderBy(
                row => row.EmpNo
            )
            .ToList();
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

    private static void
        AddCommonParameters(
            SqlCommand command,
            DateTime dateFrom,
            DateTime dateTo,
            string? department,
            string? empNo)
    {
        command.Parameters.Add(
            "@DateFrom",
            SqlDbType.DateTime
        ).Value = dateFrom.Date;

        command.Parameters.Add(
            "@DateTo",
            SqlDbType.DateTime
        ).Value = dateTo.Date;

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