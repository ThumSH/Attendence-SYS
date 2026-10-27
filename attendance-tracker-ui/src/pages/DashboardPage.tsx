/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { getDashboard } from "../services/api";

import type {
  DashboardAttendanceRow,
  DashboardData,
} from "../types/dashboard";

type DashboardStatus =
  | "All"
  | "Present"
  | "Late"
  | "Absent"
  | "Missing Check-In"
  | "Missing Check-Out"
  | "Sunday"
  | "No Record";

function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [selectedDate, setSelectedDate] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<DashboardStatus>("All");

  async function loadDashboard(date?: string) {
    setLoading(true);
    setError(null);

    try {
      const data = await getDashboard(date);

      setDashboard(data);

      if (!selectedDate) {
        setSelectedDate(data.date);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleDateChange(
    value: string
  ) {
    setSelectedDate(value);

    if (value) {
      await loadDashboard(value);
    }
  }

  async function handleRefresh() {
    await loadDashboard(
      selectedDate || undefined
    );
  }

  const filteredAttendance = useMemo(
    () => {
      if (!dashboard) {
        return [];
      }

      const normalizedSearch =
        search.trim().toLowerCase();

      return dashboard.attendance.filter(
        (row) => {
          const matchesStatus =
            statusFilter === "All" ||
            row.status === statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const searchableText = [
            row.empNo,
            row.name,
            row.department,
            row.departmentCode,
            row.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            normalizedSearch
          );
        }
      );
    },
    [
      dashboard,
      search,
      statusFilter,
    ]
  );

  if (loading && !dashboard) {
    return (
      <main className="main-content">
        <div className="dashboard-loading-state">
          <div className="dashboard-loader" />

          <h2>Loading dashboard</h2>

          <p>
            Retrieving attendance information...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      {/* =============================
          PAGE HEADER
         ============================= */}

      <header className="dashboard-page-header">
        <div>
          <span className="eyebrow">
            Attendance Management
          </span>

          <h1>Attendance Dashboard</h1>

          <p>
            Monitor daily attendance,
            incomplete punches and employee
            status.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <div className="dashboard-date-field">
            <label>
              Attendance date
            </label>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) =>
                handleDateChange(
                  e.target.value
                )
              }
            />
          </div>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {dashboard && (
        <>
          {/* =============================
              DATE / STATUS BAR
             ============================= */}

          <section className="dashboard-date-banner">
            <div>
              <span>
                Attendance Overview
              </span>

              <strong>
                {formatDisplayDate(
                  dashboard.date
                )}
              </strong>
            </div>

            <div className="dashboard-date-meta">
              <span>
                {
                  dashboard.summary
                    .attendanceRecords
                }{" "}
                attendance records
              </span>

              <span className="dashboard-live-indicator">
                <i />
                Database records
              </span>
            </div>
          </section>

          {/* =============================
              SUMMARY CARDS
             ============================= */}

          <section className="dashboard-summary-grid improved">
            <DashboardCard
              label="Total Employees"
              value={
                dashboard.summary
                  .totalEmployees
              }
              caption="Registered employees"
              type="default"
              icon="👥"
            />

            <DashboardCard
              label="Present"
              value={
                dashboard.summary.present
              }
              caption="Employees with check-in"
              type="present"
              icon="✓"
            />

            <DashboardCard
              label="Absent"
              value={
                dashboard.summary.absent
              }
              caption="Marked as absent"
              type="absent"
              icon="×"
            />

            <DashboardCard
              label="Late"
              value={
                dashboard.summary.late
              }
              caption="Late arrivals"
              type="late"
              icon="◷"
            />

            <DashboardCard
              label="Missing Check-In"
              value={
                dashboard.summary
                  .missingCheckIn
              }
              caption="Checkout without check-in"
              type="missing"
              icon="↓"
            />

            <DashboardCard
              label="Missing Check-Out"
              value={
                dashboard.summary
                  .missingCheckOut
              }
              caption="Check-in without checkout"
              type="missing"
              icon="↑"
            />
          </section>

          {/* =============================
              DEPARTMENTS / SNAPSHOT
             ============================= */}

          <section className="dashboard-layout improved-layout">
            <div className="dashboard-panel department-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-section-label">
                    Breakdown
                  </span>

                  <h2>
                    Department Overview
                  </h2>

                  <p>
                    Attendance performance by
                    department.
                  </p>
                </div>

                <span className="dashboard-record-count">
                  {
                    dashboard.departments
                      .length
                  }{" "}
                  departments
                </span>
              </div>

              <div className="department-list">
                {dashboard.departments
                  .length === 0 ? (
                  <div className="dashboard-empty">
                    No department data found.
                  </div>
                ) : (
                  dashboard.departments.map(
                    (
                      department,
                      index
                    ) => {
                      const attendanceRate =
                        department.total > 0
                          ? Math.round(
                              (department.present /
                                department.total) *
                                100
                            )
                          : 0;

                      return (
                        <div
                          className="department-row improved-department-row"
                          key={
                            department.code ??
                            index
                          }
                        >
                          <div className="department-main">
                            <div className="department-avatar">
                              {getInitials(
                                department.name
                              )}
                            </div>

                            <div>
                              <strong>
                                {department.name ||
                                  "Unknown Department"}
                              </strong>

                              <span>
                                Code:{" "}
                                {department.code ||
                                  "-"}
                              </span>
                            </div>
                          </div>

                          <div className="department-progress">
                            <div className="department-progress-label">
                              <span>
                                Attendance
                              </span>

                              <strong>
                                {
                                  attendanceRate
                                }
                                %
                              </strong>
                            </div>

                            <div className="department-progress-track">
                              <div
                                className="department-progress-fill"
                                style={{
                                  width: `${Math.min(
                                    attendanceRate,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="department-numbers improved">
                            <DepartmentMetric
                              label="Total"
                              value={
                                department.total
                              }
                            />

                            <DepartmentMetric
                              label="Present"
                              value={
                                department.present
                              }
                              type="present"
                            />

                            <DepartmentMetric
                              label="Absent"
                              value={
                                department.absent
                              }
                              type="absent"
                            />

                            <DepartmentMetric
                              label="Missing In"
                              value={
                                department.missingCheckIn
                              }
                              type="missing"
                            />

                            <DepartmentMetric
                              label="Missing Out"
                              value={
                                department.missingCheckOut
                              }
                              type="missing"
                            />
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </div>

            <div className="dashboard-panel snapshot-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-section-label">
                    Snapshot
                  </span>

                  <h2>
                    Day Summary
                  </h2>

                  <p>
                    Current attendance picture.
                  </p>
                </div>
              </div>

              <div className="snapshot-stats improved-snapshot">
                <SnapshotItem
                  label="Attendance Records"
                  value={
                    dashboard.summary
                      .attendanceRecords
                  }
                  icon="▤"
                />

                <SnapshotItem
                  label="Present"
                  value={
                    dashboard.summary
                      .present
                  }
                  icon="✓"
                  type="present"
                />

                <SnapshotItem
                  label="Absent"
                  value={
                    dashboard.summary
                      .absent
                  }
                  icon="×"
                  type="absent"
                />

                <SnapshotItem
                  label="Late"
                  value={
                    dashboard.summary.late
                  }
                  icon="◷"
                  type="late"
                />

                <SnapshotItem
                  label="Missing Check-In"
                  value={
                    dashboard.summary
                      .missingCheckIn
                  }
                  icon="↓"
                  type="missing"
                />

                <SnapshotItem
                  label="Missing Check-Out"
                  value={
                    dashboard.summary
                      .missingCheckOut
                  }
                  icon="↑"
                  type="missing"
                />
              </div>
            </div>
          </section>

          {/* =============================
              DAILY ATTENDANCE TABLE
             ============================= */}

          <section className="dashboard-panel attendance-overview-panel">
            <div className="dashboard-panel-heading attendance-heading">
              <div>
                <span className="dashboard-section-label">
                  Employees
                </span>

                <h2>Daily Attendance</h2>

                <p>
                  Detailed attendance for{" "}
                  {formatDisplayDate(
                    dashboard.date
                  )}
                </p>
              </div>

              <span className="dashboard-record-count">
                {
                  filteredAttendance.length
                }{" "}
                of{" "}
                {
                  dashboard.attendance
                    .length
                }{" "}
                records
              </span>
            </div>

            <div className="dashboard-table-toolbar">
              <div className="dashboard-search-box">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search employee, ID or department..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="dashboard-status-filter">
                <label>Status</label>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target
                        .value as DashboardStatus
                    )
                  }
                >
                  <option value="All">
                    All Statuses
                  </option>

                  <option value="Present">
                    Present
                  </option>

                  <option value="Late">
                    Late
                  </option>

                  <option value="Absent">
                    Absent
                  </option>

                  <option value="Missing Check-In">
                    Missing Check-In
                  </option>

                  <option value="Missing Check-Out">
                    Missing Check-Out
                  </option>

                  <option value="Sunday">
                    Sunday
                  </option>
                </select>
              </div>
            </div>

            <DashboardAttendanceTable
              rows={filteredAttendance}
            />
          </section>
        </>
      )}
    </main>
  );
}

/* =====================================================
   SUMMARY CARD
   ===================================================== */

interface DashboardCardProps {
  label: string;
  value: number;
  caption: string;
  icon: string;

  type:
    | "default"
    | "present"
    | "absent"
    | "late"
    | "missing";
}

function DashboardCard({
  label,
  value,
  caption,
  icon,
  type,
}: DashboardCardProps) {
  return (
    <div
      className={`dashboard-stat-card dashboard-stat-${type}`}
    >
      <div className="dashboard-card-top">
        <div
          className={`dashboard-card-icon ${type}`}
        >
          {icon}
        </div>

        <span className="dashboard-card-label">
          {label}
        </span>
      </div>

      <strong className="dashboard-card-value">
        {value}
      </strong>

      <small>{caption}</small>
    </div>
  );
}

/* =====================================================
   SNAPSHOT
   ===================================================== */

function SnapshotItem({
  label,
  value,
  icon,
  type = "default",
}: {
  label: string;
  value: number;
  icon: string;

  type?:
    | "default"
    | "present"
    | "absent"
    | "late"
    | "missing";
}) {
  return (
    <div
      className={`snapshot-item snapshot-${type}`}
    >
      <div className="snapshot-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* =====================================================
   DEPARTMENT METRIC
   ===================================================== */

function DepartmentMetric({
  label,
  value,
  type,
}: {
  label: string;
  value: number;

  type?:
    | "present"
    | "absent"
    | "missing";
}) {
  return (
    <div
      className={
        type
          ? `department-metric ${type}`
          : "department-metric"
      }
    >
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

/* =====================================================
   TABLE
   ===================================================== */

function DashboardAttendanceTable({
  rows,
}: {
  rows: DashboardAttendanceRow[];
}) {
  return (
    <div className="table-wrapper dashboard-table-wrapper">
      <table className="attendance-table dashboard-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th>Shift In</th>
            <th>Time In</th>
            <th>Shift Out</th>
            <th>Time Out</th>
            <th>Late</th>
            <th>Early</th>
            <th>OT</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={10}
                className="empty-row"
              >
                <div className="dashboard-no-results">
                  <strong>
                    No attendance records
                  </strong>

                  <span>
                    Try changing the search or
                    status filter.
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            rows.map(
              (
                row,
                index
              ) => (
                <tr
                  key={`${row.empNo}-${index}`}
                >
                  <td>
                    <div className="dashboard-employee-cell improved">
                      <div className="employee-avatar-small">
                        {getInitials(
                          row.name
                        )}
                      </div>

                      <div>
                        <strong>
                          {row.name ||
                            "Unknown"}
                        </strong>

                        <span>
                          {row.empNo ||
                            "-"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="department-pill">
                      {row.department ||
                        "-"}
                    </span>
                  </td>

                  <td>
                    {displayTime(
                      row.shiftIn
                    )}
                  </td>

                  <td>
                    {renderTimeIn(
                      row.timeIn
                    )}
                  </td>

                  <td>
                    {displayTime(
                      row.shiftOut
                    )}
                  </td>

                  <td>
                    {displayTime(
                      row.timeOut
                    )}
                  </td>

                  <td>
                    <MetricValue
                      value={row.late}
                      type="late"
                    />
                  </td>

                  <td>
                    <MetricValue
                      value={row.early}
                      type="early"
                    />
                  </td>

                  <td>
                    <MetricValue
                      value={row.ot}
                      type="ot"
                    />
                  </td>

                  <td>
                    <StatusBadge
                      status={
                        row.status
                      }
                    />
                  </td>
                </tr>
              )
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================
   STATUS
   ===================================================== */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toLowerCase();

  let className =
    "dashboard-status";

  if (normalized === "present") {
    className += " present";
  } else if (
    normalized === "absent"
  ) {
    className += " absent";
  } else if (
    normalized === "late"
  ) {
    className += " late";
  } else if (
    normalized ===
      "missing check-in" ||
    normalized ===
      "missing check-out"
  ) {
    className += " missing";
  } else if (
    normalized === "sunday"
  ) {
    className += " sunday";
  }

  return (
    <span className={className}>
      <span className="status-dot" />

      {status}
    </span>
  );
}

/* =====================================================
   METRIC VALUE
   ===================================================== */

function MetricValue({
  value,
  type,
}: {
  value: string | null;

  type:
    | "late"
    | "early"
    | "ot";
}) {
  if (
    !value ||
    value === "0" ||
    value === "00:00"
  ) {
    return (
      <span className="metric-empty">
        —
      </span>
    );
  }

  return (
    <span
      className={`dashboard-metric ${type}`}
    >
      {value}
    </span>
  );
}

/* =====================================================
   HELPERS
   ===================================================== */

function displayTime(
  value: string | null
) {
  if (
    !value ||
    value.trim() === ""
  ) {
    return (
      <span className="metric-empty">
        —
      </span>
    );
  }

  return value;
}

function renderTimeIn(
  value: string | null
) {
  if (
    !value ||
    value.trim() === ""
  ) {
    return (
      <span className="missing-time">
        Missing
      </span>
    );
  }

  if (
    value.toUpperCase() === "AB"
  ) {
    return (
      <span className="time-absent">
        AB
      </span>
    );
  }

  if (
    value.toLowerCase() ===
    "sunday"
  ) {
    return (
      <span className="time-sunday">
        Sunday
      </span>
    );
  }

  return value;
}

function formatDisplayDate(
  date: string
) {
  const parsedDate =
    new Date(`${date}T00:00:00`);

  return parsedDate.toLocaleDateString(
    "en-GB",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function getInitials(
  value?: string | null
) {
  if (!value) {
    return "?";
  }

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) =>
      word.charAt(0).toUpperCase()
    )
    .join("");
}

export default DashboardPage;