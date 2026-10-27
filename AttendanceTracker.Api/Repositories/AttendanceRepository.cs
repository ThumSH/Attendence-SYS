using AttendanceTracker.Api.DTOs;
using Microsoft.Data.SqlClient;
using System.Data;

namespace AttendanceTracker.Api.Repositories;

public sealed class AttendanceRepository
{
    private readonly IConfiguration _configuration;

    public AttendanceRepository(
        IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<AttendanceEmployeeDto?>
        GetEmployeeAsync(
            string empNo,
            DateTime from,
            DateTime to)
    {
        var connectionString =
            GetConnectionString();

        await using var connection =
            new SqlConnection(
                connectionString
            );

        await connection.OpenAsync();

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
                e.Shift

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
        ).Value = empNo.Trim();

        await using var reader =
            await command
                .ExecuteReaderAsync();

        if (
            !await reader.ReadAsync()
        )
        {
            return null;
        }

        return new AttendanceEmployeeDto
        {
            EmpNo =
                GetString(
                    reader,
                    "Empno"
                ) ?? empNo.Trim(),

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

            DateFrom =
                from.ToString(
                    "yyyy-MM-dd"
                ),

            DateTo =
                to.ToString(
                    "yyyy-MM-dd"
                )
        };
    }

    public async Task<List<AttendanceRowDto>>
        GetAttendanceRowsAsync(
            string empNo,
            DateTime from,
            DateTime to)
    {
        var connectionString =
            GetConnectionString();

        await using var connection =
            new SqlConnection(
                connectionString
            );

        await connection.OpenAsync();

        const string sql = @"
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

            WHERE
                LTRIM(RTRIM(EmpNo))
                =
                @EmpNo

                AND Date >= @DateFrom

                AND Date <
                    DATEADD(
                        DAY,
                        1,
                        @DateTo
                    )

            ORDER BY Date;
        ";

        await using var command =
            new SqlCommand(
                sql,
                connection
            );

        AddAttendanceParameters(
            command,
            empNo,
            from,
            to
        );

        var rows =
            new List<AttendanceRowDto>();

        await using var reader =
            await command
                .ExecuteReaderAsync();

        while (
            await reader.ReadAsync()
        )
        {
            rows.Add(
                new AttendanceRowDto
                {
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
                        ),

                    Abs =
                        GetString(
                            reader,
                            "Abs"
                        ),

                    LegacyStatus =
                        GetString(
                            reader,
                            "status"
                        )
                }
            );
        }

        return rows;
    }

    private string GetConnectionString()
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

        return connectionString;
    }

    private static void
        AddAttendanceParameters(
            SqlCommand command,
            string empNo,
            DateTime from,
            DateTime to)
    {
        command.Parameters.Add(
            "@EmpNo",
            SqlDbType.VarChar,
            10
        ).Value = empNo.Trim();

        command.Parameters.Add(
            "@DateFrom",
            SqlDbType.DateTime
        ).Value = from.Date;

        command.Parameters.Add(
            "@DateTo",
            SqlDbType.DateTime
        ).Value = to.Date;
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