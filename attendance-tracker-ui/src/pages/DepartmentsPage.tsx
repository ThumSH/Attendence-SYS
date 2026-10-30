import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getDepartments,
  getEmployees,
} from "../services/api";

import type {
  Department,
  Employee,
} from "../types/attendance";

interface DepartmentSummary {
  code: string;
  name: string;

  employeeCount: number;
  attendanceEnabled: number;
  disabledCount: number;

  shifts: string[];
}

function DepartmentsPage() {
  const navigate =
    useNavigate();

  const [
    departments,
    setDepartments,
  ] =
    useState<Department[]>([]);

  const [
    employees,
    setEmployees,
  ] =
    useState<Employee[]>([]);

  const [
    search,
    setSearch,
  ] =
    useState("");

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

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [
          departmentData,
          employeeData,
        ] =
          await Promise.all([
            getDepartments(),
            getEmployees(),
          ]);

        if (cancelled) {
          return;
        }

        setDepartments(
          departmentData
        );

        setEmployees(
          employeeData
        );
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Unable to load department information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const departmentSummaries =
    useMemo<
      DepartmentSummary[]
    >(() => {
      return departments.map(
        (department) => {
          const departmentEmployees =
            employees.filter(
              (employee) =>
                employee.departmentCode ===
                department.code
            );

          const attendanceEnabled =
            departmentEmployees.filter(
              (employee) =>
                isAttendanceEnabled(
                  employee
                    .attendanceEnabled
                )
            ).length;

          const disabledCount =
            departmentEmployees.length -
            attendanceEnabled;

          const shifts =
            Array.from(
              new Set(
                departmentEmployees
                  .map(
                    (employee) =>
                      employee.shift
                        ?.trim()
                  )
                  .filter(
                    (
                      shift
                    ): shift is string =>
                      Boolean(shift)
                  )
              )
            ).sort();

          return {
            code:
              department.code,

            name:
              department.name,

            employeeCount:
              departmentEmployees.length,

            attendanceEnabled,

            disabledCount,

            shifts,
          };
        }
      );
    }, [
      departments,
      employees,
    ]);

  const filteredDepartments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return departmentSummaries;
      }

      return departmentSummaries.filter(
        (department) => {
          const searchable =
            [
              department.code,
              department.name,
              ...department.shifts,
            ]
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      search,
      departmentSummaries,
    ]);

  const totalEmployees =
    useMemo(
      () =>
        filteredDepartments.reduce(
          (
            total,
            department
          ) =>
            total +
            department.employeeCount,
          0
        ),
      [
        filteredDepartments,
      ]
    );

  const enabledEmployees =
    useMemo(
      () =>
        filteredDepartments.reduce(
          (
            total,
            department
          ) =>
            total +
            department.attendanceEnabled,
          0
        ),
      [
        filteredDepartments,
      ]
    );

  const disabledEmployees =
    useMemo(
      () =>
        filteredDepartments.reduce(
          (
            total,
            department
          ) =>
            total +
            department.disabledCount,
          0
        ),
      [
        filteredDepartments,
      ]
    );

  const uniqueShifts =
    useMemo(
      () =>
        new Set(
          filteredDepartments.flatMap(
            (department) =>
              department.shifts
          )
        ).size,
      [
        filteredDepartments,
      ]
    );

  function handleViewEmployees(
    departmentCode: string
  ) {
    navigate(
      `/employees?department=${encodeURIComponent(
        departmentCode
      )}`
    );
  }

  function clearSearch() {
    setSearch("");
  }

  return (
    <main className="main-content departments-v2">
      <header className="departments-v2-header">
        <div>
          <span className="departments-v2-eyebrow">
            Attendance Management
          </span>

          <h1>
            Departments
          </h1>

          <p>
            Review department structure,
            employee distribution and
            attendance coverage.
          </p>
        </div>

        <div className="departments-v2-header-meta">
          <span>
            Organization
          </span>

          <strong>
            {
              departments.length
            }
          </strong>

          <small>
            departments loaded
          </small>
        </div>
      </header>

      <section className="departments-v2-summary-grid">
        <DepartmentSummaryCard
          label="Departments"
          value={
            filteredDepartments.length
          }
          caption="Matching current search"
          icon="▦"
          type="departments"
        />

        <DepartmentSummaryCard
          label="Employees"
          value={totalEmployees}
          caption="Across listed departments"
          icon="👥"
          type="employees"
        />

        <DepartmentSummaryCard
          label="Attendance Enabled"
          value={enabledEmployees}
          caption={`${disabledEmployees} disabled`}
          icon="✓"
          type="enabled"
        />

        <DepartmentSummaryCard
          label="Shift Groups"
          value={uniqueShifts}
          caption="Unique shifts in results"
          icon="◷"
          type="shifts"
        />
      </section>

      <section className="departments-v2-filter-panel">
        <div className="departments-v2-filter-heading">
          <div>
            <span>
              Department Directory
            </span>

            <strong>
              Find a department
            </strong>
          </div>

          <button
            type="button"
            className="departments-v2-clear-button"
            onClick={
              clearSearch
            }
            disabled={!search}
          >
            Clear Search
          </button>
        </div>

        <label className="departments-v2-search">
          <span>
            Search Departments
          </span>

          <div>
            <i>
              ⌕
            </i>

            <input
              type="search"
              placeholder="Search department name, code or shift..."
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
                aria-label="Clear search"
                onClick={
                  clearSearch
                }
              >
                ×
              </button>
            )}
          </div>
        </label>
      </section>

      {error && (
        <div className="departments-v2-error">
          <strong>
            Unable to load departments
          </strong>

          <span>
            {error}
          </span>
        </div>
      )}

      {loading ? (
        <section className="departments-v2-loading">
          <div className="departments-v2-spinner" />

          <strong>
            Loading departments
          </strong>

          <span>
            Retrieving department and
            employee information...
          </span>
        </section>
      ) : (
        <DepartmentDirectory
          departments={
            filteredDepartments
          }
          onViewEmployees={
            handleViewEmployees
          }
        />
      )}
    </main>
  );
}

function DepartmentDirectory({
  departments,
  onViewEmployees,
}: {
  departments:
    DepartmentSummary[];

  onViewEmployees:
    (
      departmentCode: string
    ) => void;
}) {
  return (
    <section className="departments-v2-directory">
      <div className="departments-v2-directory-heading">
        <div>
          <span>
            Department Overview
          </span>

          <h2>
            Department List
          </h2>

          <p>
            Employee distribution and
            attendance settings by
            department.
          </p>
        </div>

        <div className="departments-v2-directory-count">
          <strong>
            {
              departments.length
            }
          </strong>

          <span>
            departments
          </span>
        </div>
      </div>

      {departments.length ===
      0 ? (
        <div className="departments-v2-empty">
          <div>
            ⌕
          </div>

          <strong>
            No departments found
          </strong>

          <span>
            Try changing the search term.
          </span>
        </div>
      ) : (
        <div className="departments-v2-grid">
          {departments.map(
            (department) => (
              <DepartmentCard
                key={
                  department.code
                }
                department={
                  department
                }
                onViewEmployees={
                  onViewEmployees
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

function DepartmentCard({
  department,
  onViewEmployees,
}: {
  department:
    DepartmentSummary;

  onViewEmployees:
    (
      departmentCode: string
    ) => void;
}) {
  const enabledPercentage =
    department.employeeCount > 0
      ? Math.round(
          (
            department.attendanceEnabled /
            department.employeeCount
          ) * 100
        )
      : 0;

  return (
    <article className="departments-v2-card">
      <div className="departments-v2-card-header">
        <div className="departments-v2-card-icon">
          {getDepartmentInitials(
            department.name
          )}
        </div>

        <div className="departments-v2-card-title">
          <strong>
            {department.name ||
              "Unknown Department"}
          </strong>

          <span>
            Code{" "}
            {department.code ||
              "-"}
          </span>
        </div>
      </div>

      <div className="departments-v2-card-count">
        <strong>
          {
            department.employeeCount
          }
        </strong>

        <span>
          Employees
        </span>
      </div>

      <div className="departments-v2-coverage">
        <div>
          <span>
            Attendance Coverage
          </span>

          <strong>
            {
              enabledPercentage
            }
            %
          </strong>
        </div>

        <div className="departments-v2-progress">
          <span
            style={{
              width: `${Math.min(
                enabledPercentage,
                100
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="departments-v2-card-stats">
        <DepartmentMetric
          label="Enabled"
          value={
            department.attendanceEnabled
          }
          type="enabled"
        />

        <DepartmentMetric
          label="Disabled"
          value={
            department.disabledCount
          }
          type="disabled"
        />

        <DepartmentMetric
          label="Shifts"
          value={
            department.shifts.length
          }
          type="shifts"
        />
      </div>

      <div className="departments-v2-shifts">
        <span>
          Active Shifts
        </span>

        <div>
          {department.shifts.length ===
          0 ? (
            <small>
              No shift assigned
            </small>
          ) : (
            department.shifts.map(
              (shift) => (
                <span
                  className="departments-v2-shift-pill"
                  key={shift}
                >
                  Shift{" "}
                  {shift}
                </span>
              )
            )
          )}
        </div>
      </div>

      <button
        type="button"
        className="departments-v2-view-button"
        onClick={() =>
          onViewEmployees(
            department.code
          )
        }
      >
        View Employees
        <span>
          →
        </span>
      </button>
    </article>
  );
}

function DepartmentMetric({
  label,
  value,
  type,
}: {
  label: string;
  value: number;

  type:
    | "enabled"
    | "disabled"
    | "shifts";
}) {
  return (
    <div
      className={`departments-v2-metric ${type}`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function DepartmentSummaryCard({
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
    | "departments"
    | "employees"
    | "enabled"
    | "shifts";
}) {
  return (
    <article
      className={`departments-v2-summary-card ${type}`}
    >
      <div>
        <span
          className={`departments-v2-summary-icon ${type}`}
        >
          {icon}
        </span>

        <span className="departments-v2-summary-label">
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

function getDepartmentInitials(
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

export default DepartmentsPage;
