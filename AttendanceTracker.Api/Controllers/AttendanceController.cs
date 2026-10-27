using AttendanceTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AttendanceTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AttendanceController
    : ControllerBase
{
    private readonly AttendanceService
        _attendanceService;

    public AttendanceController(
        AttendanceService
            attendanceService)
    {
        _attendanceService =
            attendanceService;
    }

    [HttpGet("{empNo}")]
    public async Task<IActionResult>
        GetAttendance(
            string empNo,
            [FromQuery] DateTime from,
            [FromQuery] DateTime to)
    {
        if (
            string.IsNullOrWhiteSpace(
                empNo
            )
        )
        {
            return BadRequest(
                new
                {
                    message =
                        "Employee number is required."
                }
            );
        }

        if (from > to)
        {
            return BadRequest(
                new
                {
                    message =
                        "'from' date cannot be after 'to' date."
                }
            );
        }

        try
        {
            var report =
                await _attendanceService
                    .GetAttendanceReportAsync(
                        empNo.Trim(),
                        from.Date,
                        to.Date
                    );

            if (report is null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Employee not found."
                    }
                );
            }

            return Ok(report);
        }
        catch (
            InvalidOperationException
            ex
        )
        {
            return StatusCode(
                500,
                new
                {
                    message =
                        ex.Message
                }
            );
        }
    }
}