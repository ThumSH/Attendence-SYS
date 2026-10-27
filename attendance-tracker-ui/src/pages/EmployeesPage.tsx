import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  getDepartments,
  getEmployees,
} from "../services/api";

import type {
  Department,
  Employee,
} from "../types/attendance";

function EmployeesPage() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const departmentFromUrl =
    searchParams
      .get("department")
      ?.trim() ?? "";

  const [
    employees,
    setEmployees,
  ] =
    useState<Employee[]>([]);

  const [
    departments,
    setDepartments,
  ] =
    useState<Department[]>([]);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    department,
    setDepartment,
  ] =
    useState(
      departmentFromUrl
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    let cancelled = false;

    async function loadDepartments() {
      try {
        const data =
          await getDepartments();

        if (cancelled) {
          return;
        }

        setDepartments(data);

        if (
          departmentFromUrl &&
          !data.some(
            (item) =>
              item.code ===
              departmentFromUrl
          )
        ) {
          setDepartment("");
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Unable to load departments."
          );
        }
      }
    }

    void loadDepartments();

    return () => {
      cancelled = true;
    };
  }, [departmentFromUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      setLoading(true);
      setError(null);

      try {
        const data =
          await getEmployees(
            undefined,
            department ||
              undefined
          );

        if (!cancelled) {
          setEmployees(data);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Unable to load employee information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [department]);

  const filteredEmployees =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return employees;
      }

      return employees.filter(
        (employee) => {
          const searchable =
            [
              employee.empNo,
              employee.name,
              employee.department,
              employee.departmentCode,
              employee.shift,
              employee.status,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      employees,
      search,
    ]);

  const enabledCount =
    useMemo(
      () =>
        filteredEmployees.filter(
          (employee) =>
            isAttendanceEnabled(
              employee
                .attendanceEnabled
            )
        ).length,
      [filteredEmployees]
    );

  const departmentCount =
    useMemo(
      () =>
        new Set(
          filteredEmployees
            .map(
              (employee) =>
                employee.departmentCode
            )
            .filter(Boolean)
        ).size,
      [filteredEmployees]
    );

  const shiftCount =
    useMemo(
      () =>
        new Set(
          filteredEmployees
            .map(
              (employee) =>
                employee.shift
            )
            .filter(Boolean)
        ).size,
      [filteredEmployees]
    );

  const selectedDepartmentName =
    useMemo(
      () =>
        departments.find(
          (item) =>
            item.code === department
        )?.name ?? null,
      [
        departments,
        department,
      ]
    );

  function handleViewAttendance(
    employee: Employee
  ) {
    navigate(
      `/attendance?emp=${encodeURIComponent(
        employee.empNo
      )}`
    );
  }

  function handleDepartmentChange(
    value: string
  ) {
    setDepartment(value);
  }

  function clearFilters() {
    setSearch("");
    setDepartment("");
  }

  return (
    <main className="main-content employees-v2">
      <header className="employees-v2-header">
        <div>
          <span className="employees-v2-eyebrow">
            Attendance Management
          </span>

          <h1>
            Employees
          </h1>

          <p>
            Browse employee records,
            filter by department and open
            individual attendance history.
          </p>
        </div>

        <div className="employees-v2-header-meta">
          <span>
            Directory
          </span>

          <strong>
            {employees.length}
          </strong>

          <small>
            employees loaded
          </small>
        </div>
      </header>

      <section className="employees-v2-summary-grid">
        <EmployeeSummaryCard
          label="Employees"
          value={
            filteredEmployees.length
          }
          caption="Matching current filters"
          icon="👥"
          type="employees"
        />

        <EmployeeSummaryCard
          label="Attendance Enabled"
          value={enabledCount}
          caption="Tracked for attendance"
          icon="✓"
          type="enabled"
        />

        <EmployeeSummaryCard
          label="Departments"
          value={departmentCount}
          caption="In the current result"
          icon="▤"
          type="departments"
        />

        <EmployeeSummaryCard
          label="Shifts"
          value={shiftCount}
          caption="Assigned shift groups"
          icon="◷"
          type="shifts"
        />
      </section>

      <section className="employees-v2-filter-panel">
        <div className="employees-v2-filter-heading">
          <div>
            <span>
              Directory Filters
            </span>

            <strong>
              Find employees quickly
            </strong>
          </div>

          <button
            type="button"
            className="employees-v2-clear-button"
            onClick={
              clearFilters
            }
            disabled={
              !search &&
              !department
            }
          >
            Clear Filters
          </button>
        </div>

        <div className="employees-v2-filter-grid">
          <label className="employees-v2-search">
            <span>
              Search Employee
            </span>

            <div>
              <i>
                ⌕
              </i>

              <input
                type="search"
                placeholder="Search employee number, name, department or shift..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </label>

          <label className="employees-v2-department-filter">
            <span>
              Department
            </span>

            <select
              value={department}
              onChange={(event) =>
                handleDepartmentChange(
                  event.target.value
                )
              }
            >
              <option value="">
                All Departments
              </option>

              {departments.map(
                (item) => (
                  <option
                    key={item.code}
                    value={item.code}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </label>

          <div className="employees-v2-filter-result">
            <span>
              Showing
            </span>

            <strong>
              {
                filteredEmployees.length
              }
            </strong>

            <small>
              {selectedDepartmentName
                ? `in ${selectedDepartmentName}`
                : "employees"}
            </small>
          </div>
        </div>
      </section>

      {error && (
        <div className="employees-v2-error">
          <strong>
            Unable to load employees
          </strong>

          <span>
            {error}
          </span>
        </div>
      )}

      {loading ? (
        <section className="employees-v2-loading">
          <div className="employees-v2-spinner" />

          <strong>
            Loading employees
          </strong>

          <span>
            Retrieving employee directory
            information...
          </span>
        </section>
      ) : (
        <EmployeeDirectory
          employees={
            filteredEmployees
          }
          onViewAttendance={
            handleViewAttendance
          }
        />
      )}
    </main>
  );
}

function EmployeeDirectory({
  employees,
  onViewAttendance,
}: {
  employees: Employee[];

  onViewAttendance:
    (employee: Employee) =>
      void;
}) {
  return (
    <section className="employees-v2-table-panel">
      <div className="employees-v2-table-heading">
        <div>
          <span>
            Employee Directory
          </span>

          <h2>
            Employee List
          </h2>

          <p>
            Employee information from the
            attendance database.
          </p>
        </div>

        <div className="employees-v2-table-count">
          <strong>
            {employees.length}
          </strong>

          <span>
            records
          </span>
        </div>
      </div>

      <div className="employees-v2-table-wrapper">
        <table className="employees-v2-table">
          <thead>
            <tr>
              <th>
                Employee
              </th>

              <th>
                Employee No.
              </th>

              <th>
                Department
              </th>

              <th>
                Shift
              </th>

              <th>
                Attendance
              </th>

              <th>
                Status
              </th>

              <th>
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="employees-v2-empty-cell"
                >
                  <div className="employees-v2-empty">
                    <div>
                      ⌕
                    </div>

                    <strong>
                      No employees found
                    </strong>

                    <span>
                      Try changing the search
                      text or department filter.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              employees.map(
                (employee) => (
                  <EmployeeRow
                    key={
                      employee.empNo
                    }
                    employee={
                      employee
                    }
                    onViewAttendance={
                      onViewAttendance
                    }
                  />
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmployeeRow({
  employee,
  onViewAttendance,
}: {
  employee: Employee;

  onViewAttendance:
    (employee: Employee) =>
      void;
}) {
  return (
    <tr>
      <td>
        <div className="employees-v2-name-cell">
          <div className="employees-v2-avatar">
            {getInitials(
              employee.name
            )}
          </div>

          <div>
            <strong>
              {employee.name ||
                "Unknown Employee"}
            </strong>

            <span>
              {employee.department ||
                "No department"}
            </span>
          </div>
        </div>
      </td>

      <td>
        <span className="employees-v2-number">
          {employee.empNo}
        </span>
      </td>

      <td>
        <div className="employees-v2-department-cell">
          <strong>
            {employee.department ||
              "—"}
          </strong>

          {employee.departmentCode && (
            <span>
              Code{" "}
              {
                employee.departmentCode
              }
            </span>
          )}
        </div>
      </td>

      <td>
        {employee.shift ? (
          <span className="employees-v2-shift">
            Shift{" "}
            {employee.shift}
          </span>
        ) : (
          <span className="employees-v2-empty-value">
            —
          </span>
        )}
      </td>

      <td>
        <AttendanceEnabledBadge
          value={
            employee
              .attendanceEnabled
          }
        />
      </td>

      <td>
        <EmployeeStatusBadge
          status={
            employee.status
          }
        />
      </td>

      <td>
        <button
          type="button"
          className="employees-v2-view-button"
          onClick={() =>
            onViewAttendance(
              employee
            )
          }
        >
          View Attendance
          <span>
            →
          </span>
        </button>
      </td>
    </tr>
  );
}

function EmployeeSummaryCard({
  label,
  value,
  caption,
  icon,
  type,
}: {
  label: string;
  value: number;
  caption: string;
  icon: string;

  type:
    | "employees"
    | "enabled"
    | "departments"
    | "shifts";
}) {
  return (
    <article
      className={`employees-v2-summary-card ${type}`}
    >
      <div>
        <span className={`employees-v2-summary-icon ${type}`}>
          {icon}
        </span>

        <span className="employees-v2-summary-label">
          {label}
        </span>
      </div>

      <strong>
        {value}
      </strong>

      <small>
        {caption}
      </small>
    </article>
  );
}

function AttendanceEnabledBadge({
  value,
}: {
  value: string | null;
}) {
  const enabled =
    isAttendanceEnabled(
      value
    );

  return (
    <span
      className={`employees-v2-attendance ${
        enabled
          ? "enabled"
          : "disabled"
      }`}
    >
      <i />

      {enabled
        ? "Enabled"
        : "Disabled"}
    </span>
  );
}

function EmployeeStatusBadge({
  status,
}: {
  status: string | null;
}) {
  if (!status?.trim()) {
    return (
      <span className="employees-v2-status neutral">
        —
      </span>
    );
  }

  return (
    <span className="employees-v2-status">
      {status}
    </span>
  );
}

function isAttendanceEnabled(
  value: string | null
) {
  const normalized =
    value
      ?.trim()
      .toUpperCase();

  return (
    !normalized ||
    normalized === "Y"
  );
}

function getInitials(
  name?: string | null
) {
  if (!name?.trim()) {
    return "?";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) =>
      word
        .charAt(0)
        .toUpperCase()
    )
    .join("");
}

export default EmployeesPage;
