using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace AttendanceTracker.Api.Data;

public sealed class ApplicationDbContextFactory
    : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(
        string[] args)
    {
        var environment =
            Environment.GetEnvironmentVariable(
                "ASPNETCORE_ENVIRONMENT"
            )
            ?? "Development";

        var configuration =
            new ConfigurationBuilder()
                .SetBasePath(
                    Directory.GetCurrentDirectory()
                )
                .AddJsonFile(
                    "appsettings.json",
                    optional: false
                )
                .AddJsonFile(
                    $"appsettings.{environment}.json",
                    optional: true
                )
                .AddEnvironmentVariables()
                .Build();

        var connectionString =
            configuration
                .GetConnectionString(
                    "AppDb"
                );

        if (
            string.IsNullOrWhiteSpace(
                connectionString
            )
        )
        {
            throw new InvalidOperationException(
                "AppDb connection string is missing."
            );
        }

        var optionsBuilder =
            new DbContextOptionsBuilder<
                ApplicationDbContext
            >();

        optionsBuilder.UseSqlServer(
            connectionString
        );

        return new ApplicationDbContext(
            optionsBuilder.Options
        );
    }
}