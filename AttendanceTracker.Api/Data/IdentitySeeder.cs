using AttendanceTracker.Api.Models;
using Microsoft.AspNetCore.Identity;

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

        const string userName =
            "admin";

        var existingUser =
            await userManager
                .FindByNameAsync(userName);

        if (existingUser is not null)
        {
            return;
        }

        var user =
            new ApplicationUser
            {
                UserName = userName,
                FullName = "System Administrator",
                IsActive = true
            };

        const string initialPassword =
            "Admin1234";

        var result =
            await userManager
                .CreateAsync(
                    user,
                    initialPassword
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
                $"Failed to create initial user: {errors}"
            );
        }
    }
}