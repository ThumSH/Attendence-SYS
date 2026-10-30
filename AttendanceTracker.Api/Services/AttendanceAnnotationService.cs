using AttendanceTracker.Api.Data;
using AttendanceTracker.Api.DTOs;
using AttendanceTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AttendanceTracker.Api.Services;

public sealed class AttendanceAnnotationService
{
    private static readonly HashSet<string>
        AllowedFields =
            new(
                StringComparer.OrdinalIgnoreCase
            )
            {
                "TimeIn",
                "TimeOut",
                "ShiftIn",
                "ShiftOut",
                "Late",
                "Early",
                "Ot",
            };

    private readonly ApplicationDbContext _dbContext;

    public AttendanceAnnotationService(
        ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<
        IReadOnlyList<AttendanceAnnotationDto>>
        GetForEmployeeAsync(
            string empNo,
            DateOnly dateFrom,
            DateOnly dateTo,
            CancellationToken cancellationToken =
                default)
    {
        var normalizedEmpNo =
            empNo.Trim();

        var annotations =
            await _dbContext
                .AttendanceAnnotations
                .AsNoTracking()
                .Where(
                    annotation =>
                        annotation.EmpNo ==
                            normalizedEmpNo &&
                        annotation.AttendanceDate >=
                            dateFrom &&
                        annotation.AttendanceDate <=
                            dateTo
                )
                .OrderBy(
                    annotation =>
                        annotation.AttendanceDate
                )
                .ThenBy(
                    annotation =>
                        annotation.FieldName
                )
                .ToListAsync(
                    cancellationToken
                );

        return annotations
            .Select(Map)
            .ToList();
    }

    public async Task<
        AttendanceAnnotationDto>
        UpsertAsync(
            UpsertAttendanceAnnotationRequest
                request,
            string? userId,
            CancellationToken cancellationToken =
                default)
    {
        var empNo =
            request.EmpNo.Trim();

        var fieldName =
            NormalizeFieldName(
                request.FieldName
            );

        var reason =
            request.Reason.Trim();

        if (string.IsNullOrWhiteSpace(empNo))
        {
            throw new ArgumentException(
                "Employee number is required."
            );
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException(
                "Reason is required."
            );
        }

        if (!AllowedFields.Contains(fieldName))
        {
            throw new ArgumentException(
                "Invalid annotation field."
            );
        }

        var existing =
            await _dbContext
                .AttendanceAnnotations
                .SingleOrDefaultAsync(
                    annotation =>
                        annotation.EmpNo ==
                            empNo &&
                        annotation.AttendanceDate ==
                            request.AttendanceDate &&
                        annotation.FieldName ==
                            fieldName,
                    cancellationToken
                );

        if (existing is null)
        {
            existing =
                new AttendanceAnnotation
                {
                    EmpNo = empNo,
                    AttendanceDate =
                        request.AttendanceDate,
                    FieldName = fieldName,
                    Reason = reason,
                    CreatedByUserId =
                        userId,
                    CreatedAtUtc =
                        DateTime.UtcNow,
                    UpdatedAtUtc =
                        DateTime.UtcNow,
                };

            _dbContext
                .AttendanceAnnotations
                .Add(existing);
        }
        else
        {
            existing.Reason = reason;
            existing.UpdatedAtUtc =
                DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(
                    userId))
            {
                existing.CreatedByUserId =
                    userId;
            }
        }

        await _dbContext
            .SaveChangesAsync(
                cancellationToken
            );

        return Map(existing);
    }

    public async Task<bool>
        DeleteAsync(
            int id,
            CancellationToken cancellationToken =
                default)
    {
        var annotation =
            await _dbContext
                .AttendanceAnnotations
                .SingleOrDefaultAsync(
                    item =>
                        item.Id == id,
                    cancellationToken
                );

        if (annotation is null)
        {
            return false;
        }

        _dbContext
            .AttendanceAnnotations
            .Remove(annotation);

        await _dbContext
            .SaveChangesAsync(
                cancellationToken
            );

        return true;
    }

    private static string
        NormalizeFieldName(
            string value)
    {
        var normalized =
            value.Trim();

        return normalized.ToLowerInvariant()
            switch
            {
                "timein" => "TimeIn",
                "timeout" => "TimeOut",
                "shiftin" => "ShiftIn",
                "shiftout" => "ShiftOut",
                "late" => "Late",
                "early" => "Early",
                "ot" => "Ot",
                _ => normalized,
            };
    }

    private static
        AttendanceAnnotationDto Map(
            AttendanceAnnotation
                annotation)
    {
        return new AttendanceAnnotationDto
        {
            Id =
                annotation.Id,
            EmpNo =
                annotation.EmpNo,
            AttendanceDate =
                annotation.AttendanceDate,
            FieldName =
                annotation.FieldName,
            Reason =
                annotation.Reason,
            CreatedAtUtc =
                annotation.CreatedAtUtc,
            UpdatedAtUtc =
                annotation.UpdatedAtUtc,
        };
    }
}