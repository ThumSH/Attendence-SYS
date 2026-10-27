using AttendanceTracker.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace AttendanceTracker.Api.Data;

public static class IdentitySeeder
{
    public static async Task SeedAsync(
        IServiceProvider services)
    {
        using var scope =
            services.CreateScope();

        var userManager =
            scope.ServiceProvider
                .GetRequiredService<
                    UserManager<ApplicationUser>
                >();

        var configuration =
            scope.ServiceProvider
                .GetRequiredService<
                    IConfiguration
                >();

        var userName =
            configuration[
                "BootstrapUser:UserName"
            ];

        var password =
            configuration[
                "BootstrapUser:Password"
            ];

        var fullName =
            configuration[
                "BootstrapUser:FullName"
            ];

        if (
            string.IsNullOrWhiteSpace(
                userName
            )
            ||
            string.IsNullOrWhiteSpace(
                password
            )
        )
        {
            return;
        }

        var existingUser =
            await userManager
                .FindByNameAsync(
                    userName
                );

        if (existingUser is not null)
        {
            return;
        }

        var user =
            new ApplicationUser
            {
                UserName =
                    userName.Trim(),

                FullName =
                    string.IsNullOrWhiteSpace(
                        fullName
                    )
                        ? "System Administrator"
                        : fullName.Trim(),

                IsActive =
                    true
            };

        var result =
            await userManager
                .CreateAsync(
                    user,
                    password
                );

        if (!result.Succeeded)
        {
            var errors =
                string.Join(
                    "; ",
                    result.Errors.Select(
                        error =>
                            error.Description
                    )
                );

            throw new InvalidOperationException(
                $"Failed to create bootstrap user: {errors}"
            );
        }
    }
}