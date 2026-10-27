using AttendanceTracker.Api.Repositories;
using AttendanceTracker.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

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

app.UseCors("Frontend");

app.MapControllers();

app.Run();