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
  const navigate = useNavigate();
  const [searchParams] =
    useSearchParams();

  const departmentFromUrl =
    searchParams.get(
      "department"
    );

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
      departmentFromUrl ?? ""
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

  /* ================================
     INITIAL LOAD
     ================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const departmentData =
          await getDepartments();

        const employeeData =
          await getEmployees(
            undefined,
            departmentFromUrl ||
              undefined
          );

        if (cancelled) {
          return;
        }

        setDepartments(
          departmentData
        );

        setEmployees(
          employeeData
        );

        if (
          departmentFromUrl
        ) {
          const exists =
            departmentData.some(
              (item) =>
                item.code ===
                departmentFromUrl
            );

          if (exists) {
            setDepartment(
              departmentFromUrl
            );
          }
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

    loadData();

    return () => {
      cancelled = true;
    };
  }, [
    departmentFromUrl,
  ]);

  /* ================================
     DEPARTMENT FILTER
     ================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
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
            "Unable to load employees."
          );
        }
      }
    }

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [department]);

  /* ================================
     SEARCH
     ================================ */

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

  /* ================================
     COUNTS
     ================================ */

  const enabledCount =
    filteredEmployees.filter(
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

  const departmentCount =
    new Set(
      filteredEmployees
        .map(
          (employee) =>
            employee.departmentCode
        )
        .filter(Boolean)
    ).size;

  /* ================================
     VIEW ATTENDANCE
     ================================ */

  function handleViewAttendance(
    employee: Employee
  ) {
    navigate(
      `/attendance?emp=${encodeURIComponent(
        employee.empNo
      )}`
    );
  }

  /* ================================
     DEPARTMENT CHANGE
     ================================ */

  function handleDepartmentChange(
    value: string
  ) {
    setDepartment(value);

    /*
      We don't force-update the URL here.
      The page still works normally when
      HR changes the dropdown manually.
    */
  }

  return (
    <main className="main-content">
      {/* ============================
          HEADER
          ============================ */}

      <header className="page-header employees-page-header">
        <div>
          <span className="eyebrow">
            Attendance Management
          </span>

          <h1>
            Employees
          </h1>

          <p>
            Browse employee records
            and open individual
            attendance history.
          </p>
        </div>
      </header>

      {/* ============================
          SUMMARY
          ============================ */}

      <section className="employees-summary-grid">
        <EmployeeSummaryCard
          label="Employees"
          value={
            filteredEmployees.length
          }
          caption="Matching current filters"
        />

        <EmployeeSummaryCard
          label="Attendance Enabled"
          value={
            enabledCount
          }
          caption="Employees tracked for attendance"
          type="active"
        />

        <EmployeeSummaryCard
          label="Departments"
          value={
            departmentCount
          }
          caption="Departments in current list"
          type="department"
        />
      </section>

      {/* ============================
          FILTER BAR
          ============================ */}

      <section className="employees-filter-card">
        <div className="employees-filter-grid">
          <div className="field employees-search-field">
            <label>
              Search Employee
            </label>

            <div className="employees-search-box">
              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search employee number, name or department..."
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

          <div className="field">
            <label>
              Department
            </label>

            <select
              value={
                department
              }
              onChange={(e) =>
                handleDepartmentChange(
                  e.target.value
                )
              }
            >
              <option value="">
                All Departments
              </option>

              {departments.map(
                (item) => (
                  <option
                    key={
                      item.code
                    }
                    value={
                      item.code
                    }
                  >
                    {
                      item.name
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div className="employees-filter-result">
            <span>
              Showing
            </span>

            <strong>
              {
                filteredEmployees.length
              }
            </strong>

            <span>
              employees
            </span>
          </div>
        </div>
      </section>

      {/* ============================
          ERROR
          ============================ */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ============================
          LOADING
          ============================ */}

      {loading ? (
        <section className="employees-loading">
          <div className="dashboard-loader" />

          <strong>
            Loading employees...
          </strong>
        </section>
      ) : (
        /* ============================
           TABLE
           ============================ */

        <section className="employees-table-card">
          <div className="employees-table-heading">
            <div>
              <span className="dashboard-section-label">
                Employee Directory
              </span>

              <h2>
                Employee List
              </h2>

              <p>
                Employee information
                from the attendance
                database.
              </p>
            </div>

            <span className="dashboard-record-count">
              {
                filteredEmployees.length
              }{" "}
              employees
            </span>
          </div>

          <div className="table-wrapper employees-table-wrapper">
            <table className="attendance-table employees-table">
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
                {filteredEmployees.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={
                        7
                      }
                      className="empty-row"
                    >
                      No employees
                      found.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(
                    (
                      employee
                    ) => (
                      <tr
                        key={
                          employee.empNo
                        }
                      >
                        <td>
                          <div className="employees-name-cell">
                            <div className="employee-avatar-small">
                              {getInitials(
                                employee.name
                              )}
                            </div>

                            <div>
                              <strong>
                                {
                                  employee.name
                                }
                              </strong>

                              <span>
                                {employee.department ||
                                  "No department"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="employee-number-badge">
                            {
                              employee.empNo
                            }
                          </span>
                        </td>

                        <td>
                          <div className="employees-department-cell">
                            <strong>
                              {employee.department ||
                                "—"}
                            </strong>

                            <span>
                              {employee.departmentCode
                                ? `Code ${employee.departmentCode}`
                                : ""}
                            </span>
                          </div>
                        </td>

                        <td>
                          {employee.shift ? (
                            <span className="employee-shift-badge">
                              Shift{" "}
                              {
                                employee.shift
                              }
                            </span>
                          ) : (
                            <span className="metric-empty">
                              —
                            </span>
                          )}
                        </td>

                        <td>
                          <AttendanceEnabledBadge
                            value={
                              employee.attendanceEnabled
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
                            className="employee-view-button"
                            onClick={() =>
                              handleViewAttendance(
                                employee
                              )
                            }
                          >
                            View Attendance
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

/* =================================
   SUMMARY CARD
   ================================= */

function EmployeeSummaryCard({
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
    | "active"
    | "department";
}) {
  return (
    <div
      className={`employee-summary-card employee-summary-${type}`}
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

/* =================================
   ATTENDANCE ENABLED
   ================================= */

function AttendanceEnabledBadge({
  value,
}: {
  value:
    | string
    | null;
}) {
  const cleanValue =
    value
      ?.trim()
      .toUpperCase();

  const enabled =
    !cleanValue ||
    cleanValue === "Y";

  return (
    <span
      className={
        enabled
          ? "employee-attendance-badge enabled"
          : "employee-attendance-badge disabled"
      }
    >
      <span className="status-dot" />

      {enabled
        ? "Enabled"
        : "Disabled"}
    </span>
  );
}

/* =================================
   EMPLOYEE STATUS
   ================================= */

function EmployeeStatusBadge({
  status,
}: {
  status:
    | string
    | null;
}) {
  if (
    !status ||
    status.trim() === ""
  ) {
    return (
      <span className="employee-status-badge neutral">
        —
      </span>
    );
  }

  return (
    <span className="employee-status-badge">
      {status}
    </span>
  );
}

/* =================================
   INITIALS
   ================================= */

function getInitials(
  name:
    | string
    | null
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

export default EmployeesPage;