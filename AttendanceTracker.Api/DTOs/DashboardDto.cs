namespace AttendanceTracker.Api.DTOs;

public sealed class DashboardDto
{
    public string Date { get; set; } =
        string.Empty;

    public DashboardSummaryDto Summary
    {
        get;
        set;
    } = new();

    public List<DashboardDepartmentDto>
        Departments
    {
        get;
        set;
    } = [];

    public List<DashboardAttendanceRowDto>
        Attendance
    {
        get;
        set;
    } = [];
}

public sealed class DashboardSummaryDto
{
    public int TotalEmployees
    {
        get;
        set;
    }

    public int AttendanceRecords
    {
        get;
        set;
    }

    public int Present
    {
        get;
        set;
    }

    public int Absent
    {
        get;
        set;
    }

    public int Late
    {
        get;
        set;
    }

    public int MissingCheckIn
    {
        get;
        set;
    }

    public int MissingCheckOut
    {
        get;
        set;
    }
}

public sealed class DashboardDepartmentDto
{
    public string? Code
    {
        get;
        set;
    }

    public string? Name
    {
        get;
        set;
    }

    public int Total
    {
        get;
        set;
    }

    public int Present
    {
        get;
        set;
    }

    public int Absent
    {
        get;
        set;
    }

    public int MissingCheckIn
    {
        get;
        set;
    }

    public int MissingCheckOut
    {
        get;
        set;
    }
}

public sealed class DashboardAttendanceRowDto
{
    public string? EmpNo
    {
        get;
        set;
    }

    public string? Name
    {
        get;
        set;
    }

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

    public string? ShiftIn
    {
        get;
        set;
    }

    public string? TimeIn
    {
        get;
        set;
    }

    public string? ShiftOut
    {
        get;
        set;
    }

    public string? TimeOut
    {
        get;
        set;
    }

    public string? Late
    {
        get;
        set;
    }

    public string? Early
    {
        get;
        set;
    }

    public string? Ot
    {
        get;
        set;
    }

    public string Status
    {
        get;
        set;
    } = string.Empty;
}