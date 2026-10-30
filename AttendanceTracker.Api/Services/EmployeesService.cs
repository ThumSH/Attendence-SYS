using AttendanceTracker.Api.DTOs;
using AttendanceTracker.Api.Repositories;

namespace AttendanceTracker.Api.Services;

public sealed class EmployeesService
{
    private readonly
        EmployeesRepository
        _employeesRepository;

    public EmployeesService(
        EmployeesRepository
            employeesRepository)
    {
        _employeesRepository =
            employeesRepository;
    }

    public Task<List<EmployeeDto>>
        GetEmployeesAsync(
            string? search,
            string? department)
    {
        return _employeesRepository
            .GetEmployeesAsync(
                search,
                department
            );
    }

    public Task<EmployeeDto?>
        GetEmployeeAsync(
            string empNo)
    {
        return _employeesRepository
            .GetEmployeeAsync(
                empNo
            );
    }
}