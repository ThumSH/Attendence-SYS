using Microsoft.AspNetCore.Identity;

namespace AttendanceTracker.Api.Models;

public sealed class ApplicationUser
    : IdentityUser
{
    public string FullName
    {
        get;
        set;
    } = string.Empty;

    public bool IsActive
    {
        get;
        set;
    } = true;

    public DateTime CreatedAtUtc
    {
        get;
        set;
    } = DateTime.UtcNow;
}