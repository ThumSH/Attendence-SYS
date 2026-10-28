using AttendanceTracker.Api.Repositories;
using AttendanceTracker.Api.Services;
using AttendanceTracker.Api.Data;
using AttendanceTracker.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using AttendanceTracker.Api.Data;
using AttendanceTracker.Api.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using AttendanceTracker.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDataProtection();

var appDbConnection =
    builder.Configuration
        .GetConnectionString(
            "AppDb"
        );

if (
    string.IsNullOrWhiteSpace(
        appDbConnection
    )
)
{
    throw new InvalidOperationException(
        "Application database connection string is missing."
    );
}

builder.Services.Configure<JwtOptions>(
    builder.Configuration
        .GetSection("Jwt")
);

var jwtKey =
    builder.Configuration[
        "Jwt:Key"
    ];

var jwtIssuer =
    builder.Configuration[
        "Jwt:Issuer"
    ];

var jwtAudience =
    builder.Configuration[
        "Jwt:Audience"
    ];

if (
    string.IsNullOrWhiteSpace(jwtKey)
    ||
    string.IsNullOrWhiteSpace(jwtIssuer)
    ||
    string.IsNullOrWhiteSpace(jwtAudience)
)
{
    throw new InvalidOperationException(
        "JWT configuration is incomplete."
    );
}

builder.Services
    .AddAuthentication(
        JwtBearerDefaults
            .AuthenticationScheme
    )
    .AddJwtBearer(
        options =>
        {
            options.TokenValidationParameters =
                new TokenValidationParameters
                {
                    ValidateIssuer =
                        true,

                    ValidateAudience =
                        true,

                    ValidateLifetime =
                        true,

                    ValidateIssuerSigningKey =
                        true,

                    ValidIssuer =
                        jwtIssuer,

                    ValidAudience =
                        jwtAudience,

                    IssuerSigningKey =
                        new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(
                                jwtKey
                            )
                        ),

                    ClockSkew =
                        TimeSpan.FromMinutes(1)
                };
        }
    );

builder.Services
    .AddAuthorization();

builder.Services
    .AddScoped<JwtTokenService>();

builder.Services.AddDbContext<
    ApplicationDbContext
>(
    options =>
        options.UseSqlServer(
            appDbConnection
        )
);

builder.Services
    .AddScoped<AttendanceAnnotationService>();

builder.Services
    .AddIdentityCore<ApplicationUser>(
        options =>
        {
            options.Password.RequiredLength = 8;
            options.Password.RequireDigit = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireNonAlphanumeric = false;

            options.User.RequireUniqueEmail = false;
        }
    )
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<
    AttendanceRepository
>();

builder.Services.AddScoped<
    AttendanceService
>();

builder.Services.AddScoped<
    DashboardRepository
>();

builder.Services.AddScoped<
    DashboardService
>();

builder.Services.AddScoped<
    ReportsRepository
>();

builder.Services.AddScoped<
    ReportsService
>();

builder.Services.AddScoped<
    EmployeesRepository
>();

builder.Services.AddScoped<
    EmployeesService
>();

builder.Services.AddScoped<
    DepartmentsRepository
>();

builder.Services.AddScoped<
    DepartmentsService
>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

await IdentitySeeder.SeedAsync(
    app.Services
);

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();