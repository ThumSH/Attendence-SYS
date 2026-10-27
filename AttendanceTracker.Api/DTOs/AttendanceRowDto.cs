namespace AttendanceTracker.Api.DTOs;

public sealed class AttendanceRowDto
{
    public string Date { get; set; } =
        string.Empty;

    public string? ShiftIn { get; set; }

    public string? TimeIn { get; set; }

    public string? ShiftOut { get; set; }

    public string? TimeOut { get; set; }

    public string? Late { get; set; }

    public string? Early { get; set; }

    public string? Ot { get; set; }

    public string? Abs { get; set; }

    public string Status { get; set; } =
        string.Empty;

    public string? LegacyStatus { get; set; }
}