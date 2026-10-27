using AttendanceTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace AttendanceTracker.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class DashboardController
    : ControllerBase
{
    private readonly DashboardService
        _dashboardService;

    public DashboardController(
        DashboardService
            dashboardService)
    {
        _dashboardService =
            dashboardService;
    }

    [HttpGet]
    public async Task<IActionResult>
        GetDashboard(
            [FromQuery]
            DateTime? date = null)
    {
        try
        {
            var dashboard =
                await _dashboardService
                    .GetDashboardAsync(
                        date
                    );

            if (
                dashboard is null
            )
            {
                return Ok(
                    new
                    {
                        message =
                            "No attendance records found."
                    }
                );
            }

            return Ok(
                dashboard
            );
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