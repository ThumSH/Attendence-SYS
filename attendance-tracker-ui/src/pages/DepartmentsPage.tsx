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

  /* =========================
     LOAD DATA
     ========================= */

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

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================
     DEPARTMENT SUMMARIES
     ========================= */

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
              (employee) => {
                const value =
                  employee
                    .attendanceEnabled
                    ?.trim()
                    .toUpperCase();

                return (
                  !value ||
                  value === "Y"
                );
              }
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

  /* =========================
     SEARCH
     ========================= */

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

  /* =========================
     OVERALL COUNTS
     ========================= */

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

  /* =========================
     NAVIGATION
     ========================= */

  function handleViewEmployees(
    departmentCode: string
  ) {
    navigate(
      `/employees?department=${encodeURIComponent(
        departmentCode
      )}`
    );
  }

  return (
    <main className="main-content">
      {/* =====================
          HEADER
          ===================== */}

      <header className="page-header departments-page-header">
        <div>
          <span className="eyebrow">
            Attendance Management
          </span>

          <h1>
            Departments
          </h1>

          <p>
            Browse departments and
            review employee distribution
            across the organization.
          </p>
        </div>
      </header>

      {/* =====================
          SUMMARY
          ===================== */}

      <section className="departments-summary-grid">
        <DepartmentSummaryCard
          label="Departments"
          value={
            filteredDepartments.length
          }
          caption="Matching current search"
        />

        <DepartmentSummaryCard
          label="Employees"
          value={
            totalEmployees
          }
          caption="Employees in listed departments"
          type="employees"
        />

        <DepartmentSummaryCard
          label="Attendance Enabled"
          value={
            enabledEmployees
          }
          caption="Employees tracked for attendance"
          type="enabled"
        />
      </section>

      {/* =====================
          SEARCH
          ===================== */}

      <section className="departments-filter-card">
        <div className="field">
          <label>
            Search Departments
          </label>

          <div className="employees-search-box">
            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search department name, code or shift..."
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />
          </div>
        </div>
      </section>

      {/* =====================
          ERROR
          ===================== */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* =====================
          LOADING
          ===================== */}

      {loading ? (
        <section className="departments-loading">
          <div className="dashboard-loader" />

          <strong>
            Loading departments...
          </strong>
        </section>
      ) : (
        /* =====================
           GRID
           ===================== */

        <section className="departments-grid">
          {filteredDepartments.length ===
          0 ? (
            <div className="departments-empty">
              <h2>
                No departments found
              </h2>

              <p>
                Try changing your
                search term.
              </p>
            </div>
          ) : (
            filteredDepartments.map(
              (department) => (
                <DepartmentCard
                  key={
                    department.code
                  }
                  department={
                    department
                  }
                  onViewEmployees={
                    handleViewEmployees
                  }
                />
              )
            )
          )}
        </section>
      )}
    </main>
  );
}

/* =========================
   SUMMARY CARD
   ========================= */

function DepartmentSummaryCard({
  label,
  value,
  caption,
  type = "default",
}: {
  label: string;
  value: number;
  caption: string;

  type?:
    | "default"
    | "employees"
    | "enabled";
}) {
  return (
    <div
      className={`department-summary-card department-summary-${type}`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {caption}
      </small>
    </div>
  );
}

/* =========================
   DEPARTMENT CARD
   ========================= */

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
    department.employeeCount >
    0
      ? Math.round(
          (
            department.attendanceEnabled /
            department.employeeCount
          ) *
            100
        )
      : 0;

  return (
    <article className="department-card">
      <div className="department-card-header">
        <div className="department-card-icon">
          {getDepartmentInitials(
            department.name
          )}
        </div>

        <div className="department-card-title">
          <strong>
            {
              department.name
            }
          </strong>

          <span>
            Code{" "}
            {
              department.code
            }
          </span>
        </div>
      </div>

      <div className="department-card-count">
        <strong>
          {
            department.employeeCount
          }
        </strong>

        <span>
          Employees
        </span>
      </div>

      <div className="department-progress-section">
        <div className="department-progress-heading">
          <span>
            Attendance Enabled
          </span>

          <strong>
            {
              enabledPercentage
            }
            %
          </strong>
        </div>

        <div className="department-progress-track">
          <div
            className="department-progress-bar"
            style={{
              width: `${Math.min(
                enabledPercentage,
                100
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="department-card-stats">
        <div>
          <span>
            Enabled
          </span>

          <strong>
            {
              department.attendanceEnabled
            }
          </strong>
        </div>

        <div>
          <span>
            Disabled
          </span>

          <strong>
            {
              department.disabledCount
            }
          </strong>
        </div>

        <div>
          <span>
            Shifts
          </span>

          <strong>
            {
              department.shifts.length
            }
          </strong>
        </div>
      </div>

      <div className="department-shifts">
        <span className="department-shifts-label">
          Active Shifts
        </span>

        <div className="department-shift-list">
          {department.shifts.length ===
          0 ? (
            <span className="department-no-shifts">
              No shift assigned
            </span>
          ) : (
            department.shifts.map(
              (shift) => (
                <span
                  className="department-shift-pill"
                  key={
                    shift
                  }
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
        className="department-view-button"
        onClick={() =>
          onViewEmployees(
            department.code
          )
        }
      >
        View Employees
      </button>
    </article>
  );
}

/* =========================
   INITIALS
   ========================= */

function getDepartmentInitials(
  name: string
) {
  if (!name) {
    return "?";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase()
    )
    .join("");
}

export default DepartmentsPage;