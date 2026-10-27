using AttendanceTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AttendanceTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ReportsController
    : ControllerBase
{
    private readonly ReportsService
        _reportsService;

    public ReportsController(
        ReportsService
            reportsService)
    {
        _reportsService =
            reportsService;
    }

    [HttpGet]
    public async Task<IActionResult>
        GetReport(
            [FromQuery]
            string type = "daily",

            [FromQuery]
            DateTime? from = null,

            [FromQuery]
            DateTime? to = null,

            [FromQuery]
            string? department = null,

            [FromQuery]
            string? empNo = null)
    {
        if (
            !_reportsService
                .IsSupportedType(type)
        )
        {
            return BadRequest(
                new
                {
                    message =
                        "Invalid report type."
                }
            );
        }

        try
        {
            var report =
                await _reportsService
                    .GetReportAsync(
                        type,
                        from,
                        to,
                        department,
                        empNo
                    );

            if (
                report is null
            )
            {
                return Ok(
                    new
                    {
                        type =
                            type.Trim()
                                .ToLowerInvariant(),

                        rows =
                            Array.Empty<object>()
                    }
                );
            }

            return Ok(
                report
            );
        }
        catch (
            ArgumentException ex
        )
        {
            return BadRequest(
                new
                {
                    message =
                        ex.Message
                }
            );
        }
        catch (
            InvalidOperationException ex
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