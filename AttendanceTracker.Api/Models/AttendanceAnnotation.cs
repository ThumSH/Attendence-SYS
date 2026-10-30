namespace AttendanceTracker.Api.Models;

public sealed class AttendanceAnnotation
{
    public int Id { get; set; }

    public string EmpNo { get; set; } =
        string.Empty;

    public DateOnly AttendanceDate { get; set; }

    public string FieldName { get; set; } =
        string.Empty;

    public string Reason { get; set; } =
        string.Empty;

    public string? CreatedByUserId { get; set; }

    public DateTime CreatedAtUtc { get; set; } =
        DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } =
        DateTime.UtcNow;
}