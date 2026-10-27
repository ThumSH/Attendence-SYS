using AttendanceTracker.Api.DTOs;
using AttendanceTracker.Api.Repositories;
using AttendanceTracker.Api.Utilities;

namespace AttendanceTracker.Api.Services;

public sealed class ReportsService
{
    private static readonly
        HashSet<string>
        SupportedTypes =
        [
            "daily",
            "monthly",
            "late",
            "absent",
            "missing",
            "ot"
        ];

    private readonly
        ReportsRepository
        _reportsRepository;

    public ReportsService(
        ReportsRepository
            reportsRepository)
    {
        _reportsRepository =
            reportsRepository;
    }

    public bool IsSupportedType(
        string type)
    {
        return SupportedTypes
            .Contains(
                type.Trim()
                    .ToLowerInvariant()
            );
    }

    public async Task<ReportResponseDto?>
        GetReportAsync(
            string type,
            DateTime? from,
            DateTime? to,
            string? department,
            string? empNo)
    {
        type =
            type.Trim()
                .ToLowerInvariant();

        DateTime dateFrom;
        DateTime dateTo;

        if (
            from.HasValue
            &&
            to.HasValue
        )
        {
            dateFrom =
                from.Value.Date;

            dateTo =
                to.Value.Date;
        }
        else
        {
            var latestDate =
                await _reportsRepository
                    .GetLatestAttendanceDateAsync();

            if (
                !latestDate.HasValue
            )
            {
                return null;
            }

            dateFrom =
                latestDate.Value;

            dateTo =
                latestDate.Value;
        }

        if (
            dateFrom > dateTo
        )
        {
            throw new ArgumentException(
                "From date cannot be after To date."
            );
        }

        if (
            type == "monthly"
        )
        {
            return await
                BuildMonthlyReportAsync(
                    dateFrom,
                    dateTo,
                    department,
                    empNo
                );
        }

        return await
            BuildDetailReportAsync(
                type,
                dateFrom,
                dateTo,
                department,
                empNo
            );
    }

    private async Task<ReportResponseDto>
        BuildDetailReportAsync(
            string type,
            DateTime dateFrom,
            DateTime dateTo,
            string? department,
            string? empNo)
    {
        var allRows =
            await _reportsRepository
                .GetDetailRowsAsync(
                    dateFrom,
                    dateTo,
                    department,
                    empNo
                );

        foreach (
            var row in allRows
        )
        {
            row.Status =
                AttendanceInterpreter
                    .GetStatus(
                        row.TimeIn,
                        row.TimeOut,
                        row.Late
                    );
        }

        var filteredRows =
            type switch
            {
                "late" =>
                    allRows
                        .Where(
                            row =>
                                AttendanceInterpreter
                                    .IsLate(
                                        row.Late
                                    )
                        )
                        .ToList(),

                "absent" =>
                    allRows
                        .Where(
                            row =>
                                AttendanceInterpreter
                                    .IsAbsent(
                                        row.TimeIn
                                    )
                        )
                        .ToList(),

                "missing" =>
                    allRows
                        .Where(
                            row =>
                                AttendanceInterpreter
                                    .HasMissingCheckIn(
                                        row.TimeIn,
                                        row.TimeOut
                                    )
                                ||
                                AttendanceInterpreter
                                    .HasMissingCheckOut(
                                        row.TimeIn,
                                        row.TimeOut
                                    )
                        )
                        .ToList(),

                "ot" =>
                    allRows
                        .Where(
                            row =>
                                AttendanceInterpreter
                                    .ParseMinutes(
                                        row.Ot
                                    ) > 0
                        )
                        .ToList(),

                _ =>
                    allRows
            };

        var present = 0;
        var absent = 0;
        var late = 0;
        var missingCheckIn = 0;
        var missingCheckOut = 0;

        var totalLateMinutes = 0;
        var totalEarlyMinutes = 0;
        var totalOtMinutes = 0;

        foreach (
            var row in filteredRows
        )
        {
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

            totalLateMinutes +=
                AttendanceInterpreter
                    .ParseMinutes(
                        row.Late
                    );

            totalEarlyMinutes +=
                AttendanceInterpreter
                    .ParseMinutes(
                        row.Early
                    );

            totalOtMinutes +=
                AttendanceInterpreter
                    .ParseMinutes(
                        row.Ot
                    );
        }

        return new ReportResponseDto
        {
            Type =
                type,

            DateFrom =
                dateFrom.ToString(
                    "yyyy-MM-dd"
                ),

            DateTo =
                dateTo.ToString(
                    "yyyy-MM-dd"
                ),

            Filters =
                new ReportFiltersDto
                {
                    Department =
                        department,

                    EmpNo =
                        empNo
                },

            Summary =
                new ReportSummaryDto
                {
                    RecordCount =
                        filteredRows.Count,

                    Present =
                        present,

                    Absent =
                        absent,

                    Late =
                        late,

                    MissingCheckIn =
                        missingCheckIn,

                    MissingCheckOut =
                        missingCheckOut,

                    TotalLateMinutes =
                        totalLateMinutes,

                    TotalEarlyMinutes =
                        totalEarlyMinutes,

                    TotalOtMinutes =
                        totalOtMinutes,

                    TotalLate =
                        AttendanceInterpreter
                            .FormatMinutes(
                                totalLateMinutes
                            ),

                    TotalEarly =
                        AttendanceInterpreter
                            .FormatMinutes(
                                totalEarlyMinutes
                            ),

                    TotalOT =
                        AttendanceInterpreter
                            .FormatMinutes(
                                totalOtMinutes
                            )
                },

            Rows =
                filteredRows
        };
    }

    private async Task<ReportResponseDto>
        BuildMonthlyReportAsync(
            DateTime dateFrom,
            DateTime dateTo,
            string? department,
            string? empNo)
    {
        var detailRows =
            await _reportsRepository
                .GetDetailRowsAsync(
                    dateFrom,
                    dateTo,
                    department,
                    empNo
                );

        var monthlyRows =
            detailRows
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
                    {
                        var rows =
                            group.ToList();

                        return new
                            MonthlyReportRowDto
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
                                rows.Count,

                            PresentDays =
                                rows.Count(
                                    row =>
                                        AttendanceInterpreter
                                            .HasValidTimeIn(
                                                row.TimeIn
                                            )
                                ),

                            AbsentDays =
                                rows.Count(
                                    row =>
                                        AttendanceInterpreter
                                            .IsAbsent(
                                                row.TimeIn
                                            )
                                ),

                            LateDays =
                                rows.Count(
                                    row =>
                                        AttendanceInterpreter
                                            .IsLate(
                                                row.Late
                                            )
                                ),

                            MissingCheckIn =
                                rows.Count(
                                    row =>
                                        AttendanceInterpreter
                                            .HasMissingCheckIn(
                                                row.TimeIn,
                                                row.TimeOut
                                            )
                                ),

                            MissingCheckOut =
                                rows.Count(
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
                    row =>
                        row.EmpNo
                )
                .ToList();

        return new ReportResponseDto
        {
            Type =
                "monthly",

            DateFrom =
                dateFrom.ToString(
                    "yyyy-MM-dd"
                ),

            DateTo =
                dateTo.ToString(
                    "yyyy-MM-dd"
                ),

            Filters =
                new ReportFiltersDto
                {
                    Department =
                        department,

                    EmpNo =
                        empNo
                },

            Summary =
                new ReportSummaryDto
                {
                    EmployeeCount =
                        monthlyRows.Count
                },

            Rows =
                monthlyRows
        };
    }
}