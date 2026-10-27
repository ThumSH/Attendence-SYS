namespace AttendanceTracker.Api.DTOs;

public sealed class LoginRequestDto
{
    public string UserName { get; set; } =
        string.Empty;

    public string Password { get; set; } =
        string.Empty;
}