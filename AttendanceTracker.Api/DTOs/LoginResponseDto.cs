namespace AttendanceTracker.Api.DTOs;

public sealed class LoginResponseDto
{
    public string Token { get; set; } =
        string.Empty;

    public DateTime ExpiresAtUtc
    {
        get;
        set;
    }

    public AuthUserDto User
    {
        get;
        set;
    } = new();
}

public sealed class AuthUserDto
{
    public string Id { get; set; } =
        string.Empty;

    public string UserName { get; set; } =
        string.Empty;

    public string FullName { get; set; } =
        string.Empty;
}