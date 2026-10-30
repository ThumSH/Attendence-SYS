using AttendanceTracker.Api.DTOs;
using AttendanceTracker.Api.Repositories;

namespace AttendanceTracker.Api.Services;

public sealed class DepartmentsService
{
    private readonly
        DepartmentsRepository
        _departmentsRepository;

    public DepartmentsService(
        DepartmentsRepository
            departmentsRepository)
    {
        _departmentsRepository =
            departmentsRepository;
    }

    public Task<List<DepartmentDto>>
        GetDepartmentsAsync()
    {
        return _departmentsRepository
            .GetDepartmentsAsync();
    }
}