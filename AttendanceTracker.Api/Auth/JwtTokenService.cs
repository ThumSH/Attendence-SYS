using AttendanceTracker.Api.DTOs;
using AttendanceTracker.Api.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AttendanceTracker.Api.Auth;

public sealed class JwtTokenService
{
    private readonly JwtOptions
        _options;

    public JwtTokenService(
        IOptions<JwtOptions> options)
    {
        _options =
            options.Value;
    }

    public LoginResponseDto CreateToken(
        ApplicationUser user)
    {
        var expiresAtUtc =
            DateTime.UtcNow.AddMinutes(
                _options.ExpiresMinutes
            );

        var claims =
            new List<Claim>
            {
                new(
                    JwtRegisteredClaimNames.Sub,
                    user.Id
                ),

                new(
                    ClaimTypes.NameIdentifier,
                    user.Id
                ),

                new(
                    ClaimTypes.Name,
                    user.UserName
                    ?? string.Empty
                ),

                new(
                    "full_name",
                    user.FullName
                )
            };

        var key =
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _options.Key
                )
            );

        var credentials =
            new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

        var token =
            new JwtSecurityToken(
                issuer:
                    _options.Issuer,

                audience:
                    _options.Audience,

                claims:
                    claims,

                expires:
                    expiresAtUtc,

                signingCredentials:
                    credentials
            );

        return new LoginResponseDto
        {
            Token =
                new JwtSecurityTokenHandler()
                    .WriteToken(token),

            ExpiresAtUtc =
                expiresAtUtc,

            User =
                new AuthUserDto
                {
                    Id =
                        user.Id,

                    UserName =
                        user.UserName
                        ?? string.Empty,

                    FullName =
                        user.FullName
                }
        };
    }
}