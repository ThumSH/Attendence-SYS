using AttendanceTracker.Api.DTOs;
using AttendanceTracker.Api.Repositories;
using AttendanceTracker.Api.Utilities;

namespace AttendanceTracker.Api.Services;

public sealed class AttendanceService
{
    private readonly
        AttendanceRepository
        _attendanceRepository;

    public AttendanceService(
        AttendanceRepository
            attendanceRepository)
    {
        _attendanceRepository =
            attendanceRepository;
    }

    public async Task<AttendanceReportDto?>
        GetAttendanceReportAsync(
            string empNo,
            DateTime from,
            DateTime to)
    {
        var employee =
            await _attendanceRepository
                .GetEmployeeAsync(
                    empNo,
                    from,
                    to
                );

        if (employee is null)
        {
            return null;
        }

        var rows =
            await _attendanceRepository
                .GetAttendanceRowsAsync(
                    empNo,
                    from,
                    to
                );

        var lateMinutes = 0;
        var earlyMinutes = 0;
        var otMinutes = 0;

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

            lateMinutes +=
                AttendanceInterpreter
                    .ParseMinutes(
                        row.Late
                    );

            earlyMinutes +=
                AttendanceInterpreter
                    .ParseMinutes(
                        row.Early
                    );

            otMinutes +=
                AttendanceInterpreter
                    .ParseMinutes(
                        row.Ot
                    );
        }

        return new AttendanceReportDto
        {
            Employee =
                employee,

            Attendance =
                rows,

            Totals =
                new AttendanceTotalsDto
                {
                    LateMinutes =
                        lateMinutes,

                    EarlyMinutes =
                        earlyMinutes,

                    OtMinutes =
                        otMinutes,

                    TotalLate =
                        AttendanceInterpreter
                            .FormatMinutes(
                                lateMinutes
                            ),

                    TotalEarly =
                        AttendanceInterpreter
                            .FormatMinutes(
                                earlyMinutes
                            ),

                    TotalOT =
                        AttendanceInterpreter
                            .FormatMinutes(
                                otMinutes
                            )
                }
        };
    }
}