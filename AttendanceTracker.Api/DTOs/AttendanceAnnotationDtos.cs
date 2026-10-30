namespace AttendanceTracker.Api.DTOs;

public sealed class AttendanceAnnotationDto
{
    public int Id { get; set; }

    public string EmpNo { get; set; } =
        string.Empty;

    public DateOnly AttendanceDate { get; set; }

    public string FieldName { get; set; } =
        string.Empty;

    public string Reason { get; set; } =
        string.Empty;

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}

public sealed class UpsertAttendanceAnnotationRequest
{
    public string EmpNo { get; set; } =
        string.Empty;

    public DateOnly AttendanceDate { get; set; }

    public string FieldName { get; set; } =
        string.Empty;

    public string Reason { get; set; } =
        string.Empty;
}