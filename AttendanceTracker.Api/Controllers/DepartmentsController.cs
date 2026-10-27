using AttendanceTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace AttendanceTracker.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class DepartmentsController
    : ControllerBase
{
    private readonly
        DepartmentsService
        _departmentsService;

    public DepartmentsController(
        DepartmentsService
            departmentsService)
    {
        _departmentsService =
            departmentsService;
    }

    [HttpGet]
    public async Task<IActionResult>
        GetDepartments()
    {
        try
        {
            var departments =
                await _departmentsService
                    .GetDepartmentsAsync();

            return Ok(
                departments
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