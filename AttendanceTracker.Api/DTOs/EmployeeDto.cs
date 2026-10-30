namespace AttendanceTracker.Api.DTOs;

public sealed class EmployeeDto
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

    public string? Shift
    {
        get;
        set;
    }

    public string? Status
    {
        get;
        set;
    }

    public string? AttendanceEnabled
    {
        get;
        set;
    }
}