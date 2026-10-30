using System.Security.Claims;
using AttendanceTracker.Api.DTOs;
using AttendanceTracker.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AttendanceTracker.Api.Controllers;

[ApiController]
[Route("api/attendance-annotations")]
[Authorize]
public sealed class AttendanceAnnotationsController
    : ControllerBase
{
    private readonly AttendanceAnnotationService
        _service;

    public AttendanceAnnotationsController(
        AttendanceAnnotationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<
        IReadOnlyList<AttendanceAnnotationDto>>>
        GetForEmployee(
            [FromQuery] string empNo,
            [FromQuery] DateOnly dateFrom,
            [FromQuery] DateOnly dateTo,
            CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(empNo))
        {
            return BadRequest(
                "Employee number is required."
            );
        }

        if (dateFrom > dateTo)
        {
            return BadRequest(
                "dateFrom cannot be after dateTo."
            );
        }

        var result =
            await _service
                .GetForEmployeeAsync(
                    empNo,
                    dateFrom,
                    dateTo,
                    cancellationToken
                );

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<
        AttendanceAnnotationDto>>
        Upsert(
            [FromBody]
            UpsertAttendanceAnnotationRequest
                request,
            CancellationToken cancellationToken)
    {
        try
        {
            var userId =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            var result =
                await _service.UpsertAsync(
                    request,
                    userId,
                    cancellationToken
                );

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(
                ex.Message
            );
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult>
        Delete(
            int id,
            CancellationToken cancellationToken)
    {
        var deleted =
            await _service.DeleteAsync(
                id,
                cancellationToken
            );

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}