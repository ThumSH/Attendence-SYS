using AttendanceTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AttendanceTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class EmployeesController
    : ControllerBase
{
    private readonly EmployeesService
        _employeesService;

    public EmployeesController(
        EmployeesService
            employeesService)
    {
        _employeesService =
            employeesService;
    }

    [HttpGet]
    public async Task<IActionResult>
        GetEmployees(
            [FromQuery]
            string? search = null,

            [FromQuery]
            string? department = null)
    {
        try
        {
            var employees =
                await _employeesService
                    .GetEmployeesAsync(
                        search,
                        department
                    );

            return Ok(
                employees
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

    [HttpGet("{empNo}")]
    public async Task<IActionResult>
        GetEmployee(
            string empNo)
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

        try
        {
            var employee =
                await _employeesService
                    .GetEmployeeAsync(
                        empNo.Trim()
                    );

            if (
                employee is null
            )
            {
                return NotFound(
                    new
                    {
                        message =
                            "Employee not found."
                    }
                );
            }

            return Ok(
                employee
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