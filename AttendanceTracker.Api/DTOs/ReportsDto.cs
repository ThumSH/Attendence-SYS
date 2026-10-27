namespace AttendanceTracker.Api.DTOs;

public sealed class ReportResponseDto
{
    public string Type { get; set; } =
        string.Empty;

    public string DateFrom { get; set; } =
        string.Empty;

    public string DateTo { get; set; } =
        string.Empty;

    public ReportFiltersDto Filters
    {
        get;
        set;
    } = new();

    public ReportSummaryDto Summary
    {
        get;
        set;
    } = new();

    public object Rows
    {
        get;
        set;
    } = Array.Empty<object>();
}

public sealed class ReportFiltersDto
{
    public string? Department
    {
        get;
        set;
    }

    public string? EmpNo
    {
        get;
        set;
    }
}

public sealed class ReportSummaryDto
{
    public int? RecordCount
    {
        get;
        set;
    }

    public int? Present
    {
        get;
        set;
    }

    public int? Absent
    {
        get;
        set;
    }

    public int? Late
    {
        get;
        set;
    }

    public int? MissingCheckIn
    {
        get;
        set;
    }

    public int? MissingCheckOut
    {
        get;
        set;
    }

    public int? TotalLateMinutes
    {
        get;
        set;
    }

    public int? TotalEarlyMinutes
    {
        get;
        set;
    }

    public int? TotalOtMinutes
    {
        get;
        set;
    }

    public string? TotalLate
    {
        get;
        set;
    }

    public string? TotalEarly
    {
        get;
        set;
    }

    public string? TotalOT
    {
        get;
        set;
    }

    public int? EmployeeCount
    {
        get;
        set;
    }
}

public sealed class ReportRowDto
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

    public string Date
    {
        get;
        set;
    } = string.Empty;

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

public sealed class MonthlyReportRowDto
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

    public int TotalRows
    {
        get;
        set;
    }

    public int PresentDays
    {
        get;
        set;
    }

    public int AbsentDays
    {
        get;
        set;
    }

    public int LateDays
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