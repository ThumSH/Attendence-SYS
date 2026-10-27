using AttendanceTracker.Api.Auth;
using AttendanceTracker.Api.DTOs;
using AttendanceTracker.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace AttendanceTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController
    : ControllerBase
{
    private readonly
        UserManager<ApplicationUser>
        _userManager;

    private readonly
        JwtTokenService
        _jwtTokenService;

    public AuthController(
        UserManager<ApplicationUser>
            userManager,
        JwtTokenService
            jwtTokenService)
    {
        _userManager =
            userManager;

        _jwtTokenService =
            jwtTokenService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult>
        Login(
            LoginRequestDto request)
    {
        if (
            string.IsNullOrWhiteSpace(
                request.UserName
            )
            ||
            string.IsNullOrWhiteSpace(
                request.Password
            )
        )
        {
            return BadRequest(
                new
                {
                    message =
                        "Username and password are required."
                }
            );
        }

        var user =
            await _userManager
                .FindByNameAsync(
                    request.UserName.Trim()
                );

        if (
            user is null
            ||
            !user.IsActive
        )
        {
            return Unauthorized(
                new
                {
                    message =
                        "Invalid username or password."
                }
            );
        }

        var validPassword =
            await _userManager
                .CheckPasswordAsync(
                    user,
                    request.Password
                );

        if (!validPassword)
        {
            return Unauthorized(
                new
                {
                    message =
                        "Invalid username or password."
                }
            );
        }

        return Ok(
            _jwtTokenService
                .CreateToken(user)
        );
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult>
        Me()
    {
        var userId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (
            string.IsNullOrWhiteSpace(
                userId
            )
        )
        {
            return Unauthorized();
        }

        var user =
            await _userManager
                .FindByIdAsync(
                    userId
                );

        if (
            user is null
            ||
            !user.IsActive
        )
        {
            return Unauthorized();
        }

        return Ok(
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
        );
    }
}