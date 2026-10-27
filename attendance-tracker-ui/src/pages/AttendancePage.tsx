import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import EmployeePicker from "../components/EmployeePicker";

import {
  getAttendance,
  getDepartments,
  getEmployees,
} from "../services/api";

import type {
  AttendanceReport,
  AttendanceRow,
  Department,
  Employee,
} from "../types/attendance";

type QuickRange =
  | "month"
  | "30days";

function AttendancePage() {
  const [searchParams] =
    useSearchParams();

  const employeeFromUrl =
    searchParams
      .get("emp")
      ?.trim() ?? "";

  const defaultRange =
    useMemo(
      () => getDefaultDateRange(),
      []
    );

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
    department,
    setDepartment,
  ] =
    useState("");

  const [
    selectedEmployee,
    setSelectedEmployee,
  ] =
    useState(employeeFromUrl);

  const [
    from,
    setFrom,
  ] =
    useState(defaultRange.from);

  const [
    to,
    setTo,
  ] =
    useState(defaultRange.to);

  const [
    report,
    setReport,
  ] =
    useState<AttendanceReport | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    loadingEmployees,
    setLoadingEmployees,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(null);

  const autoLoadedReport =
    useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDepartments() {
      try {
        const data =
          await getDepartments();

        if (!cancelled) {
          setDepartments(data);
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      setLoadingEmployees(true);

      try {
        const data =
          await getEmployees(
            undefined,
            department || undefined
          );

        if (cancelled) {
          return;
        }

        setEmployees(data);

        setSelectedEmployee(
          (currentEmployee) => {
            if (!currentEmployee) {
              return "";
            }

            const employeeStillExists =
              data.some(
                (employee) =>
                  employee.empNo.trim() ===
                  currentEmployee.trim()
              );

            if (employeeStillExists) {
              return currentEmployee;
            }

            setReport(null);
            autoLoadedReport.current =
              null;

            return "";
          }
        );
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Unable to load employees."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingEmployees(false);
        }
      }
    }

    void loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [department]);

  useEffect(() => {
    if (
      !employeeFromUrl ||
      !selectedEmployee ||
      !from ||
      !to ||
      employees.length === 0
    ) {
      return;
    }

    const employeeExists =
      employees.some(
        (employee) =>
          employee.empNo.trim() ===
          employeeFromUrl
      );

    if (
      !employeeExists ||
      selectedEmployee.trim() !==
        employeeFromUrl
    ) {
      return;
    }

    const autoLoadKey =
      `${selectedEmployee}|${from}|${to}`;

    if (
      autoLoadedReport.current ===
      autoLoadKey
    ) {
      return;
    }

    autoLoadedReport.current =
      autoLoadKey;

    let cancelled = false;

    async function loadUrlReport() {
      setLoading(true);
      setError(null);

      try {
        const data =
          await getAttendance(
            selectedEmployee,
            from,
            to
          );

        if (!cancelled) {
          setReport(data);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Unable to load attendance report."
          );

          autoLoadedReport.current =
            null;
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUrlReport();

    return () => {
      cancelled = true;
    };
  }, [
    employeeFromUrl,
    employees,
    selectedEmployee,
    from,
    to,
  ]);

  async function handleViewReport() {
    if (!selectedEmployee) {
      setError(
        "Please select an employee."
      );

      return;
    }

    if (!from || !to) {
      setError(
        "Please select both dates."
      );

      return;
    }

    if (from > to) {
      setError(
        "Date from cannot be after date to."
      );

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data =
        await getAttendance(
          selectedEmployee,
          from,
          to
        );

      setReport(data);

      if (
        employeeFromUrl &&
        selectedEmployee.trim() ===
          employeeFromUrl
      ) {
        autoLoadedReport.current =
          `${selectedEmployee}|${from}|${to}`;
      }
    } catch (err) {
      console.error(err);

      setError(
        "Failed to load attendance report."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDepartmentChange(
    value: string
  ) {
    setDepartment(value);
    setReport(null);
    autoLoadedReport.current = null;
  }

  function handleEmployeeChange(
    empNo: string
  ) {
    setSelectedEmployee(empNo);
    setReport(null);
    autoLoadedReport.current = null;
  }

  function handleFromChange(
    value: string
  ) {
    setFrom(value);
    setReport(null);
    autoLoadedReport.current = null;
  }

  function handleToChange(
    value: string
  ) {
    setTo(value);
    setReport(null);
    autoLoadedReport.current = null;
  }

  function applyQuickRange(
    range: QuickRange
  ) {
    const dates =
      range === "month"
        ? getDefaultDateRange()
        : getLast30DaysRange();

    setFrom(dates.from);
    setTo(dates.to);
    setReport(null);
    autoLoadedReport.current = null;
  }

  function resetFilters() {
    const dates =
      getDefaultDateRange();

    setDepartment("");
    setSelectedEmployee("");
    setFrom(dates.from);
    setTo(dates.to);
    setReport(null);
    setError(null);
    autoLoadedReport.current = null;
  }

  const selectedEmployeeData =
    useMemo(
      () =>
        employees.find(
          (employee) =>
            employee.empNo.trim() ===
            selectedEmployee.trim()
        ) ?? null,
      [
        employees,
        selectedEmployee,
      ]
    );

  return (
    <main className="main-content attendance-v2">
      <header className="attendance-v2-header">
        <div>
          <span className="attendance-v2-eyebrow">
            Attendance Management
          </span>

          <h1>
            Individual Attendance
          </h1>

          <p>
            Review processed attendance,
            exceptions and working-time
            totals for an employee.
          </p>
        </div>

        <button
          type="button"
          className="attendance-v2-print-button"
          onClick={() =>
            window.print()
          }
          disabled={!report}
        >
          <span>
            ⎙
          </span>

          Print Report
        </button>
      </header>

      <section className="attendance-v2-filter-panel">
        <div className="attendance-v2-filter-heading">
          <div>
            <span>
              Report Filters
            </span>

            <strong>
              Select employee and date range
            </strong>
          </div>

          <div className="attendance-v2-quick-ranges">
            <button
              type="button"
              onClick={() =>
                applyQuickRange(
                  "month"
                )
              }
            >
              This Month
            </button>

            <button
              type="button"
              onClick={() =>
                applyQuickRange(
                  "30days"
                )
              }
            >
              Last 30 Days
            </button>

            <button
              type="button"
              className="attendance-v2-reset"
              onClick={
                resetFilters
              }
            >
              Reset
            </button>
          </div>
        </div>

        <div className="attendance-v2-filter-grid">
          <label className="attendance-v2-field">
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
                All departments
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

          <div className="attendance-v2-field attendance-v2-employee-field">
            <span>
              Employee
            </span>

            <EmployeePicker
              employees={employees}
              value={
                selectedEmployee
              }
              onChange={
                handleEmployeeChange
              }
            />

            {loadingEmployees && (
              <small>
                Updating employee list...
              </small>
            )}
          </div>

          <label className="attendance-v2-field">
            <span>
              Date From
            </span>

            <input
              type="date"
              value={from}
              onChange={(event) =>
                handleFromChange(
                  event.target.value
                )
              }
            />
          </label>

          <label className="attendance-v2-field">
            <span>
              Date To
            </span>

            <input
              type="date"
              value={to}
              onChange={(event) =>
                handleToChange(
                  event.target.value
                )
              }
            />
          </label>

          <button
            type="button"
            className="attendance-v2-view-button"
            onClick={() =>
              void handleViewReport()
            }
            disabled={
              loading ||
              loadingEmployees
            }
          >
            {loading
              ? "Loading..."
              : "View Report"}
          </button>
        </div>

        {selectedEmployeeData && (
          <div className="attendance-v2-selection">
            <span>
              Selected
            </span>

            <strong>
              {
                selectedEmployeeData.name
              }
            </strong>

            <small>
              {
                selectedEmployeeData.empNo
              }
              {" · "}
              {selectedEmployeeData.department ||
                "No department"}
              {" · "}
              Shift{" "}
              {selectedEmployeeData.shift ||
                "-"}
            </small>
          </div>
        )}

        {error && (
          <div className="attendance-v2-error">
            <strong>
              Unable to continue
            </strong>

            <span>
              {error}
            </span>
          </div>
        )}
      </section>

      {!report && !loading && (
        <section className="attendance-v2-empty-state">
          <div className="attendance-v2-empty-icon">
            ▤
          </div>

          <h2>
            Select an employee
          </h2>

          <p>
            Choose an employee and date
            range above, then select
            View Report to load their
            processed attendance records.
          </p>
        </section>
      )}

      {loading && !report && (
        <section className="attendance-v2-loading-state">
          <div className="attendance-v2-spinner" />

          <strong>
            Loading attendance report
          </strong>

          <span>
            Retrieving processed attendance
            information...
          </span>
        </section>
      )}

      {report && (
        <>
          <PrintHeader
            report={report}
          />

          <EmployeeOverview
            report={report}
          />

          <AttendanceSummary
            report={report}
          />

          <AttendanceDetails
            report={report}
            refreshing={loading}
          />
        </>
      )}
    </main>
  );
}

function EmployeeOverview({
  report,
}: {
  report: AttendanceReport;
}) {
  return (
    <section className="attendance-v2-employee-overview">
      <div className="attendance-v2-employee-main">
        <div className="attendance-v2-avatar">
          {getInitials(
            report.employee.name
          )}
        </div>

        <div>
          <span>
            Employee
          </span>

          <h2>
            {report.employee.name}
          </h2>

          <small>
            {report.employee.empNo}
          </small>
        </div>
      </div>

      <EmployeeDetail
        label="Department"
        value={
          report.employee.department ||
          "-"
        }
      />

      <EmployeeDetail
        label="Shift"
        value={
          report.employee.shift ||
          "-"
        }
      />

      <EmployeeDetail
        label="Period"
        value={`${formatShortDate(
          report.employee.dateFrom
        )} – ${formatShortDate(
          report.employee.dateTo
        )}`}
      />
    </section>
  );
}

function EmployeeDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="attendance-v2-employee-detail">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function AttendanceSummary({
  report,
}: {
  report: AttendanceReport;
}) {
  const stats =
    getAttendanceStats(
      report.attendance
    );

  return (
    <section className="attendance-v2-summary-grid">
      <AttendanceStat
        label="Records"
        value={String(
          report.attendance.length
        )}
        caption={`${stats.present} present · ${stats.absent} absent`}
        type="records"
      />

      <AttendanceStat
        label="Total Late"
        value={
          report.totals.totalLate
        }
        caption={`${report.totals.lateMinutes} minutes`}
        type="late"
      />

      <AttendanceStat
        label="Total Early"
        value={
          report.totals.totalEarly
        }
        caption={`${report.totals.earlyMinutes} minutes`}
        type="early"
      />

      <AttendanceStat
        label="Total OT"
        value={
          report.totals.totalOT
        }
        caption={`${report.totals.otMinutes} minutes`}
        type="ot"
      />

      <AttendanceStat
        label="Exceptions"
        value={String(
          stats.exceptions
        )}
        caption={`${stats.missing} missing punch`}
        type="exception"
      />
    </section>
  );
}

function AttendanceStat({
  label,
  value,
  caption,
  type,
}: {
  label: string;
  value: string;
  caption: string;
  type:
    | "records"
    | "late"
    | "early"
    | "ot"
    | "exception";
}) {
  return (
    <article
      className={`attendance-v2-stat ${type}`}
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
    </article>
  );
}

function AttendanceDetails({
  report,
  refreshing,
}: {
  report: AttendanceReport;
  refreshing: boolean;
}) {
  return (
    <section className="attendance-v2-report-panel">
      <div className="attendance-v2-report-heading">
        <div>
          <span>
            Attendance Records
          </span>

          <h2>
            Daily Attendance Details
          </h2>

          <p>
            {report.employee.name}
            {" · "}
            {report.employee.empNo}
          </p>
        </div>

        <div className="attendance-v2-report-meta">
          <strong>
            {report.attendance.length}
          </strong>

          <span>
            records
          </span>

          {refreshing && (
            <small>
              Updating...
            </small>
          )}
        </div>
      </div>

      <div className="attendance-v2-table-wrapper">
        <table className="attendance-v2-table">
          <thead>
            <tr>
              <th>
                Date
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
            {report.attendance.length ===
            0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="attendance-v2-table-empty"
                >
                  No attendance records
                  found for this period.
                </td>
              </tr>
            ) : (
              report.attendance.map(
                (
                  row,
                  index
                ) => (
                  <AttendanceRowView
                    key={`${row.date}-${index}`}
                    row={row}
                  />
                )
              )
            )}

            {report.attendance.length >
              0 && (
              <tr className="attendance-v2-total-row">
                <td colSpan={5}>
                  Period Totals
                </td>

                <td>
                  {
                    report.totals
                      .totalLate
                  }
                </td>

                <td>
                  {
                    report.totals
                      .totalEarly
                  }
                </td>

                <td>
                  {
                    report.totals
                      .totalOT
                  }
                </td>

                <td>
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AttendanceRowView({
  row,
}: {
  row: AttendanceRow;
}) {
  return (
    <tr>
      <td>
        <div className="attendance-v2-date-cell">
          <strong>
            {formatDay(
              row.date
            )}
          </strong>

          <span>
            {formatRowDate(
              row.date
            )}
          </span>
        </div>
      </td>

      <td>
        {displayValue(
          row.shiftIn
        )}
      </td>

      <td>
        {renderAttendanceTime(
          row.timeIn
        )}
      </td>

      <td>
        {displayValue(
          row.shiftOut
        )}
      </td>

      <td>
        {renderMissingTime(
          row.timeOut,
          row.status ===
            "Missing Check-Out"
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
          status={row.status}
        />
      </td>
    </tr>
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
  if (isZeroMetric(value)) {
    return (
      <span className="attendance-v2-empty-value">
        —
      </span>
    );
  }

  return (
    <span
      className={`attendance-v2-metric ${type}`}
    >
      {value}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`attendance-v2-status ${getStatusClass(
        status
      )}`}
    >
      <i />

      {status}
    </span>
  );
}

function PrintHeader({
  report,
}: {
  report: AttendanceReport;
}) {
  return (
    <section className="attendance-v2-print-header">
      <div>
        <h1>
          COLOUR PLUS PRINTING SYSTEMS
        </h1>

        <h2>
          Individual Attendance Summary
        </h2>
      </div>

      <div className="attendance-v2-print-info">
        <p>
          <strong>
            Date From:
          </strong>{" "}
          {report.employee.dateFrom}
        </p>

        <p>
          <strong>
            Date To:
          </strong>{" "}
          {report.employee.dateTo}
        </p>

        <p>
          <strong>
            Employee:
          </strong>{" "}
          {report.employee.empNo}
          {"  "}
          {report.employee.name}
        </p>

        <p>
          <strong>
            Department:
          </strong>{" "}
          {report.employee.department ||
            "-"}
        </p>
      </div>
    </section>
  );
}

function getAttendanceStats(
  rows: AttendanceRow[]
) {
  const present =
    rows.filter(
      (row) =>
        row.status === "Present" ||
        row.status === "Late"
    ).length;

  const absent =
    rows.filter(
      (row) =>
        row.status === "Absent"
    ).length;

  const missing =
    rows.filter(
      (row) =>
        row.status ===
          "Missing Check-In" ||
        row.status ===
          "Missing Check-Out"
    ).length;

  const exceptions =
    rows.filter(
      (row) =>
        row.status === "Late" ||
        row.status === "Absent" ||
        row.status ===
          "Missing Check-In" ||
        row.status ===
          "Missing Check-Out"
    ).length;

  return {
    present,
    absent,
    missing,
    exceptions,
  };
}

function getDefaultDateRange() {
  const today =
    new Date();

  const firstDay =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

  return {
    from:
      formatDateInput(
        firstDay
      ),

    to:
      formatDateInput(
        today
      ),
  };
}

function getLast30DaysRange() {
  const today =
    new Date();

  const from =
    new Date(today);

  from.setDate(
    today.getDate() - 29
  );

  return {
    from:
      formatDateInput(from),

    to:
      formatDateInput(today),
  };
}

function formatDateInput(
  value: Date
) {
  const year =
    value.getFullYear();

  const month =
    String(
      value.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      value.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function formatShortDate(
  value: string
) {
  const date =
    parseLocalDate(value);

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDay(
  value: string
) {
  const date =
    parseLocalDate(value);

  return date.toLocaleDateString(
    "en-GB",
    {
      weekday: "short",
    }
  );
}

function formatRowDate(
  value: string
) {
  const date =
    parseLocalDate(value);

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function parseLocalDate(
  value: string
) {
  return new Date(
    `${value}T00:00:00`
  );
}

function displayValue(
  value: string | null
) {
  if (
    !value ||
    !value.trim()
  ) {
    return (
      <span className="attendance-v2-empty-value">
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
      <span className="attendance-v2-missing">
        Missing
      </span>
    );
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  if (normalized === "ab") {
    return (
      <span className="attendance-v2-absent-time">
        AB
      </span>
    );
  }

  if (
    normalized === "sunday"
  ) {
    return (
      <span className="attendance-v2-sunday-time">
        Sunday
      </span>
    );
  }

  return value;
}

function renderMissingTime(
  value: string | null,
  missing: boolean
) {
  if (
    missing &&
    (!value ||
      !value.trim())
  ) {
    return (
      <span className="attendance-v2-missing">
        Missing
      </span>
    );
  }

  return displayValue(value);
}

function isZeroMetric(
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
    normalized === "0:00" ||
    normalized === "00:00"
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

export default AttendancePage;
