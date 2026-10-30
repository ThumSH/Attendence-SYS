namespace AttendanceTracker.Api.DTOs;

public sealed class AttendanceReportDto
{
    public AttendanceEmployeeDto Employee
    {
        get;
        set;
    } = new();

    public List<AttendanceRowDto> Attendance
    {
        get;
        set;
    } = [];

    public AttendanceTotalsDto Totals
    {
        get;
        set;
    } = new();
}

public sealed class AttendanceEmployeeDto
{
    public string EmpNo { get; set; } =
        string.Empty;

    public string Name { get; set; } =
        string.Empty;

    public string? DepartmentCode
    {
        get;
        set;
    }

    public string? Department
    {
        get;
        set;
    }

    public string? Shift { get; set; }

    public string DateFrom { get; set; } =
        string.Empty;

    public string DateTo { get; set; } =
        string.Empty;
}

public sealed class AttendanceTotalsDto
{
    public int LateMinutes { get; set; }

    public int EarlyMinutes { get; set; }

    public int OtMinutes { get; set; }

    public string TotalLate { get; set; } =
        "0:00";

    public string TotalEarly { get; set; } =
        "0:00";

    public string TotalOT { get; set; } =
        "0:00";
}