using AttendanceTracker.Api.DTOs;
using AttendanceTracker.Api.Repositories;
using AttendanceTracker.Api.Utilities;

namespace AttendanceTracker.Api.Services;

public sealed class DashboardService
{
    private readonly
        DashboardRepository
        _dashboardRepository;

    public DashboardService(
        DashboardRepository
            dashboardRepository)
    {
        _dashboardRepository =
            dashboardRepository;
    }

    public async Task<DashboardDto?>
        GetDashboardAsync(
            DateTime? requestedDate)
    {
        DateTime dashboardDate;

        if (requestedDate.HasValue)
        {
            dashboardDate =
                requestedDate
                    .Value
                    .Date;
        }
        else
        {
            var latestDate =
                await _dashboardRepository
                    .GetLatestAttendanceDateAsync();

            if (
                !latestDate.HasValue
            )
            {
                return null;
            }

            dashboardDate =
                latestDate.Value;
        }

        var totalEmployeesTask =
            _dashboardRepository
                .GetTotalEmployeesAsync();

        var rowsTask =
            _dashboardRepository
                .GetAttendanceRowsAsync(
                    dashboardDate
                );

        await Task.WhenAll(
            totalEmployeesTask,
            rowsTask
        );

        var totalEmployees =
            await totalEmployeesTask;

        var rows =
            await rowsTask;

        var present = 0;
        var absent = 0;
        var late = 0;
        var missingCheckIn = 0;
        var missingCheckOut = 0;

        foreach (
            var row in rows
        )
        {
            row.Status =
                AttendanceInterpreter
                    .GetStatus(
                        row.TimeIn,
                        row.TimeOut,
                        row.Late
                    );

            /*
             * IMPORTANT:
             * These summary metrics are
             * independent flags.
             *
             * Someone can therefore be:
             *
             * Present + Late
             *
             * or
             *
             * Present + Late
             * + Missing Check-Out
             */

            if (
                AttendanceInterpreter
                    .HasValidTimeIn(
                        row.TimeIn
                    )
            )
            {
                present++;
            }

            if (
                AttendanceInterpreter
                    .IsAbsent(
                        row.TimeIn
                    )
            )
            {
                absent++;
            }

            if (
                AttendanceInterpreter
                    .IsLate(
                        row.Late
                    )
            )
            {
                late++;
            }

            if (
                AttendanceInterpreter
                    .HasMissingCheckIn(
                        row.TimeIn,
                        row.TimeOut
                    )
            )
            {
                missingCheckIn++;
            }

            if (
                AttendanceInterpreter
                    .HasMissingCheckOut(
                        row.TimeIn,
                        row.TimeOut
                    )
            )
            {
                missingCheckOut++;
            }
        }

        var departments =
            BuildDepartmentSummary(
                rows
            );

        return new DashboardDto
        {
            Date =
                dashboardDate
                    .ToString(
                        "yyyy-MM-dd"
                    ),

            Summary =
                new DashboardSummaryDto
                {
                    TotalEmployees =
                        totalEmployees,

                    AttendanceRecords =
                        rows.Count,

                    Present =
                        present,

                    Absent =
                        absent,

                    Late =
                        late,

                    MissingCheckIn =
                        missingCheckIn,

                    MissingCheckOut =
                        missingCheckOut
                },

            Departments =
                departments,

            Attendance =
                rows
        };
    }

    private static
        List<DashboardDepartmentDto>
        BuildDepartmentSummary(
            IEnumerable<
                DashboardAttendanceRowDto>
                rows)
    {
        return rows
            .GroupBy(
                row => new
                {
                    row.DepartmentCode,
                    row.Department
                }
            )
            .Select(
                group =>
                {
                    var departmentRows =
                        group.ToList();

                    return new
                        DashboardDepartmentDto
                    {
                        Code =
                            group.Key
                                .DepartmentCode,

                        Name =
                            group.Key
                                .Department,

                        Total =
                            departmentRows.Count,

                        Present =
                            departmentRows.Count(
                                row =>
                                    AttendanceInterpreter
                                        .HasValidTimeIn(
                                            row.TimeIn
                                        )
                            ),

                        Absent =
                            departmentRows.Count(
                                row =>
                                    AttendanceInterpreter
                                        .IsAbsent(
                                            row.TimeIn
                                        )
                            ),

                        MissingCheckIn =
                            departmentRows.Count(
                                row =>
                                    AttendanceInterpreter
                                        .HasMissingCheckIn(
                                            row.TimeIn,
                                            row.TimeOut
                                        )
                            ),

                        MissingCheckOut =
                            departmentRows.Count(
                                row =>
                                    AttendanceInterpreter
                                        .HasMissingCheckOut(
                                            row.TimeIn,
                                            row.TimeOut
                                        )
                            )
                    };
                }
            )
            .OrderBy(
                department =>
                    department.Name
            )
            .ToList();
    }
}