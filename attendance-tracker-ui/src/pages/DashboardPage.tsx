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

const STATUS_OPTIONS: DashboardStatus[] = [
  "All",
  "Present",
  "Late",
  "Absent",
  "Missing Check-In",
  "Missing Check-Out",
  "Sunday",
  "No Record",
];

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

  useEffect(() => {
    let cancelled = false;

    async function loadInitialDashboard() {
      try {
        const data =
          await getDashboard();

        if (cancelled) {
          return;
        }

        setDashboard(data);
        setSelectedDate(data.date);
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Unable to load dashboard information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadDashboard(
    date?: string
  ) {
    setLoading(true);
    setError(null);

    try {
      const data =
        await getDashboard(date);

      setDashboard(data);
      setSelectedDate(data.date);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDateChange(
    value: string
  ) {
    setSelectedDate(value);

    if (!value) {
      await loadDashboard();
      return;
    }

    await loadDashboard(value);
  }

  async function handleRefresh() {
    await loadDashboard(
      selectedDate || undefined
    );
  }

  const filteredAttendance =
    useMemo(() => {
      if (!dashboard) {
        return [];
      }

      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

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
    }, [
      dashboard,
      search,
      statusFilter,
    ]);

  if (loading && !dashboard) {
    return (
      <main className="main-content">
        <div className="dashboard-v2-loading">
          <div className="dashboard-v2-spinner" />

          <strong>
            Loading attendance dashboard
          </strong>

          <span>
            Retrieving the latest attendance
            information...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content dashboard-v2">
      <DashboardHeader
        selectedDate={selectedDate}
        loading={loading}
        onDateChange={
          handleDateChange
        }
        onRefresh={handleRefresh}
      />

      {error && (
        <div className="dashboard-v2-error">
          <div>
            <strong>
              Could not load dashboard
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              void handleRefresh()
            }
          >
            Try again
          </button>
        </div>
      )}

      {dashboard && (
        <>
          <OverviewBanner
            dashboard={dashboard}
            loading={loading}
          />

          <SummaryCards
            dashboard={dashboard}
          />

          <section className="dashboard-v2-middle-grid">
            <DepartmentOverview
              dashboard={dashboard}
            />

            <DaySummary
              dashboard={dashboard}
            />
          </section>

          <DailyAttendance
            dashboard={dashboard}
            rows={filteredAttendance}
            search={search}
            statusFilter={statusFilter}
            onSearchChange={setSearch}
            onStatusChange={
              setStatusFilter
            }
          />
        </>
      )}
    </main>
  );
}

function DashboardHeader({
  selectedDate,
  loading,
  onDateChange,
  onRefresh,
}: {
  selectedDate: string;
  loading: boolean;

  onDateChange:
    (value: string) =>
      Promise<void>;

  onRefresh:
    () => Promise<void>;
}) {
  return (
    <header className="dashboard-v2-header">
      <div className="dashboard-v2-title">
        <span className="dashboard-v2-eyebrow">
          Attendance Management
        </span>

        <h1>
          Dashboard
        </h1>

        <p>
          Daily attendance overview,
          employee activity and exceptions.
        </p>
      </div>

      <div className="dashboard-v2-header-actions">
        <label className="dashboard-v2-date-control">
          <span>
            Attendance Date
          </span>

          <input
            type="date"
            value={selectedDate}
            disabled={loading}
            onChange={(event) =>
              void onDateChange(
                event.target.value
              )
            }
          />
        </label>

        <button
          type="button"
          className="dashboard-v2-refresh"
          disabled={loading}
          onClick={() =>
            void onRefresh()
          }
        >
          <span className="dashboard-v2-refresh-icon">
            ↻
          </span>

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>
    </header>
  );
}

function OverviewBanner({
  dashboard,
  loading,
}: {
  dashboard: DashboardData;
  loading: boolean;
}) {
  return (
    <section className="dashboard-v2-overview">
      <div>
        <span className="dashboard-v2-overview-label">
          Attendance Overview
        </span>

        <strong>
          {formatDisplayDate(
            dashboard.date
          )}
        </strong>

        <small>
          Daily processed attendance
          information
        </small>
      </div>

      <div className="dashboard-v2-overview-meta">
        <div>
          <span>
            Records
          </span>

          <strong>
            {
              dashboard.summary
                .attendanceRecords
            }
          </strong>
        </div>

        <div className="dashboard-v2-source-status">
          <i />

          <span>
            {loading
              ? "Updating"
              : "Database records"}
          </span>
        </div>
      </div>
    </section>
  );
}

function SummaryCards({
  dashboard,
}: {
  dashboard: DashboardData;
}) {
  return (
    <section className="dashboard-v2-summary-grid">
      <SummaryCard
        label="Employees"
        value={
          dashboard.summary
            .totalEmployees
        }
        description="Registered employees"
        icon="👥"
        type="employees"
      />

      <SummaryCard
        label="Present"
        value={
          dashboard.summary.present
        }
        description="Employees checked in"
        icon="✓"
        type="present"
      />

      <SummaryCard
        label="Late"
        value={
          dashboard.summary.late
        }
        description="Late arrivals"
        icon="◷"
        type="late"
      />

      <SummaryCard
        label="Absent"
        value={
          dashboard.summary.absent
        }
        description="Marked absent"
        icon="×"
        type="absent"
      />

      <SummaryCard
        label="Missing Check-In"
        value={
          dashboard.summary
            .missingCheckIn
        }
        description="Checkout without check-in"
        icon="↓"
        type="missing"
      />

      <SummaryCard
        label="Missing Check-Out"
        value={
          dashboard.summary
            .missingCheckOut
        }
        description="Check-in without checkout"
        icon="↑"
        type="missing"
      />
    </section>
  );
}

type SummaryType =
  | "employees"
  | "present"
  | "late"
  | "absent"
  | "missing";

function SummaryCard({
  label,
  value,
  description,
  icon,
  type,
}: {
  label: string;
  value: number;
  description: string;
  icon: string;
  type: SummaryType;
}) {
  return (
    <article
      className={`dashboard-v2-stat-card ${type}`}
    >
      <div className="dashboard-v2-stat-top">
        <span
          className={`dashboard-v2-stat-icon ${type}`}
        >
          {icon}
        </span>

        <span className="dashboard-v2-stat-label">
          {label}
        </span>
      </div>

      <strong className="dashboard-v2-stat-value">
        {value}
      </strong>

      <span className="dashboard-v2-stat-description">
        {description}
      </span>
    </article>
  );
}

function DepartmentOverview({
  dashboard,
}: {
  dashboard: DashboardData;
}) {
  return (
    <section className="dashboard-v2-panel dashboard-v2-departments">
      <PanelHeading
        eyebrow="Breakdown"
        title="Department Overview"
        description="Attendance status by department."
        trailing={`${dashboard.departments.length} departments`}
      />

      <div className="dashboard-v2-department-list">
        {dashboard.departments.length ===
        0 ? (
          <EmptyState
            title="No departments"
            description="No department attendance information was found for this date."
          />
        ) : (
          dashboard.departments.map(
            (
              department,
              index
            ) => {
              const attendanceRate =
                department.total > 0
                  ? Math.round(
                      (
                        department.present /
                        department.total
                      ) * 100
                    )
                  : 0;

              return (
                <article
                  className="dashboard-v2-department-row"
                  key={
                    department.code ??
                    index
                  }
                >
                  <div className="dashboard-v2-department-identity">
                    <div className="dashboard-v2-department-avatar">
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
                        Code{" "}
                        {department.code ||
                          "-"}
                      </span>
                    </div>
                  </div>

                  <div className="dashboard-v2-department-rate">
                    <div>
                      <span>
                        Attendance
                      </span>

                      <strong>
                        {attendanceRate}%
                      </strong>
                    </div>

                    <div className="dashboard-v2-progress">
                      <span
                        style={{
                          width: `${Math.min(
                            attendanceRate,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="dashboard-v2-department-metrics">
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
                        department
                          .missingCheckIn
                      }
                      type="missing"
                    />

                    <DepartmentMetric
                      label="Missing Out"
                      value={
                        department
                          .missingCheckOut
                      }
                      type="missing"
                    />
                  </div>
                </article>
              );
            }
          )
        )}
      </div>
    </section>
  );
}

function DepartmentMetric({
  label,
  value,
  type = "default",
}: {
  label: string;
  value: number;

  type?:
    | "default"
    | "present"
    | "absent"
    | "missing";
}) {
  return (
    <div
      className={`dashboard-v2-department-metric ${type}`}
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

function DaySummary({
  dashboard,
}: {
  dashboard: DashboardData;
}) {
  return (
    <aside className="dashboard-v2-panel dashboard-v2-day-summary">
      <PanelHeading
        eyebrow="Snapshot"
        title="Day Summary"
        description="Quick view of the selected date."
      />

      <div className="dashboard-v2-record-total">
        <span>
          Attendance Records
        </span>

        <strong>
          {
            dashboard.summary
              .attendanceRecords
          }
        </strong>

        <small>
          {formatShortDate(
            dashboard.date
          )}
        </small>
      </div>

      <div className="dashboard-v2-summary-list">
        <SummaryRow
          label="Present"
          value={
            dashboard.summary.present
          }
          icon="✓"
          type="present"
        />

        <SummaryRow
          label="Late"
          value={
            dashboard.summary.late
          }
          icon="◷"
          type="late"
        />

        <SummaryRow
          label="Absent"
          value={
            dashboard.summary.absent
          }
          icon="×"
          type="absent"
        />

        <SummaryRow
          label="Missing Check-In"
          value={
            dashboard.summary
              .missingCheckIn
          }
          icon="↓"
          type="missing"
        />

        <SummaryRow
          label="Missing Check-Out"
          value={
            dashboard.summary
              .missingCheckOut
          }
          icon="↑"
          type="missing"
        />
      </div>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  icon,
  type,
}: {
  label: string;
  value: number;
  icon: string;

  type:
    | "present"
    | "late"
    | "absent"
    | "missing";
}) {
  return (
    <div className="dashboard-v2-summary-row">
      <div>
        <span
          className={`dashboard-v2-summary-row-icon ${type}`}
        >
          {icon}
        </span>

        <span>
          {label}
        </span>
      </div>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function DailyAttendance({
  dashboard,
  rows,
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
}: {
  dashboard: DashboardData;
  rows: DashboardAttendanceRow[];
  search: string;
  statusFilter: DashboardStatus;

  onSearchChange:
    (value: string) => void;

  onStatusChange:
    (value: DashboardStatus) => void;
}) {
  return (
    <section className="dashboard-v2-panel dashboard-v2-attendance-panel">
      <PanelHeading
        eyebrow="Employees"
        title="Daily Attendance"
        description={`Attendance information for ${formatDisplayDate(
          dashboard.date
        )}`}
        trailing={`${rows.length} of ${dashboard.attendance.length} records`}
      />

      <div className="dashboard-v2-table-toolbar">
        <label className="dashboard-v2-search">
          <span>
            ⌕
          </span>

          <input
            type="search"
            value={search}
            placeholder="Search employee, ID or department..."
            onChange={(event) =>
              onSearchChange(
                event.target.value
              )
            }
          />
        </label>

        <label className="dashboard-v2-status-select">
          <span>
            Status
          </span>

          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusChange(
                event.target
                  .value as DashboardStatus
              )
            }
          >
            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  value={status}
                  key={status}
                >
                  {status === "All"
                    ? "All Statuses"
                    : status}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <DashboardAttendanceTable
        rows={rows}
      />
    </section>
  );
}

function DashboardAttendanceTable({
  rows,
}: {
  rows: DashboardAttendanceRow[];
}) {
  return (
    <div className="dashboard-v2-table-container">
      <table className="dashboard-v2-table">
        <thead>
          <tr>
            <th>
              Employee
            </th>

            <th>
              Department
            </th>

            <th>
              Shift In
            </th>

            <th>
              Time In
            </th>

            <th>
              Shift Out
            </th>

            <th>
              Time Out
            </th>

            <th>
              Late
            </th>

            <th>
              Early
            </th>

            <th>
              OT
            </th>

            <th>
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={10}
                className="dashboard-v2-table-empty-cell"
              >
                <EmptyState
                  title="No attendance records"
                  description="Try changing the search text or status filter."
                />
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
                    <div className="dashboard-v2-employee">
                      <div className="dashboard-v2-employee-avatar">
                        {getInitials(
                          row.name
                        )}
                      </div>

                      <div>
                        <strong>
                          {row.name ||
                            "Unknown Employee"}
                        </strong>

                        <span>
                          {row.empNo ||
                            "-"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="dashboard-v2-department-pill">
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
                    {renderAttendanceTime(
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

function PanelHeading({
  eyebrow,
  title,
  description,
  trailing,
}: {
  eyebrow: string;
  title: string;
  description: string;
  trailing?: string;
}) {
  return (
    <div className="dashboard-v2-panel-heading">
      <div>
        <span className="dashboard-v2-section-label">
          {eyebrow}
        </span>

        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>
      </div>

      {trailing && (
        <span className="dashboard-v2-count">
          {trailing}
        </span>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const className =
    getStatusClass(status);

  return (
    <span
      className={`dashboard-v2-status ${className}`}
    >
      <i />

      {status}
    </span>
  );
}

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
  if (isEmptyMetric(value)) {
    return (
      <span className="dashboard-v2-empty-value">
        —
      </span>
    );
  }

  return (
    <span
      className={`dashboard-v2-metric ${type}`}
    >
      {value}
    </span>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="dashboard-v2-empty">
      <strong>
        {title}
      </strong>

      <span>
        {description}
      </span>
    </div>
  );
}

function displayTime(
  value: string | null
) {
  if (
    !value ||
    !value.trim()
  ) {
    return (
      <span className="dashboard-v2-empty-value">
        —
      </span>
    );
  }

  return value;
}

function renderAttendanceTime(
  value: string | null
) {
  if (
    !value ||
    !value.trim()
  ) {
    return (
      <span className="dashboard-v2-time-warning">
        Missing
      </span>
    );
  }

  const normalized =
    value.trim().toLowerCase();

  if (
    normalized === "ab"
  ) {
    return (
      <span className="dashboard-v2-time-absent">
        AB
      </span>
    );
  }

  if (
    normalized === "sunday"
  ) {
    return (
      <span className="dashboard-v2-time-sunday">
        Sunday
      </span>
    );
  }

  return value;
}

function isEmptyMetric(
  value: string | null
) {
  if (!value) {
    return true;
  }

  const normalized =
    value.trim();

  return (
    normalized === "" ||
    normalized === "0" ||
    normalized === "00:00" ||
    normalized === "0:00"
  );
}

function getStatusClass(
  status: string
) {
  const normalized =
    status
      .trim()
      .toLowerCase();

  switch (normalized) {
    case "present":
      return "present";

    case "late":
      return "late";

    case "absent":
      return "absent";

    case "missing check-in":
    case "missing check-out":
      return "missing";

    case "sunday":
      return "sunday";

    case "no record":
      return "no-record";

    default:
      return "default";
  }
}

function formatDisplayDate(
  date: string
) {
  const parsedDate =
    new Date(
      `${date}T00:00:00`
    );

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

function formatShortDate(
  date: string
) {
  const parsedDate =
    new Date(
      `${date}T00:00:00`
    );

  return parsedDate.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getInitials(
  value?: string | null
) {
  if (!value?.trim()) {
    return "?";
  }

  return value
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

export default DashboardPage;