import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDepartments,
  getEmployees,
  getReport,
} from "../services/api";

import type {
  Department,
  Employee,
} from "../types/attendance";

import type {
  MonthlyReportRow,
  ReportResponse,
  ReportRow,
  ReportType,
} from "../types/reports";

function ReportsPage() {
  const [reportType, setReportType] =
    useState<ReportType>("daily");

  const [dateFrom, setDateFrom] =
    useState("2026-09-01");

  const [dateTo, setDateTo] =
    useState("2026-09-30");

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [department, setDepartment] =
    useState("");

  const [selectedEmployeeNo, setSelectedEmployeeNo] =
    useState("");

  const [report, setReport] =
    useState<ReportResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [filtersLoading, setFiltersLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ==========================================
     INITIAL FILTER DATA
     ========================================== */

  useEffect(() => {
    async function loadInitialData() {
      setFiltersLoading(true);
      setError(null);

      try {
        const [
          departmentData,
          employeeData,
        ] = await Promise.all([
          getDepartments(),
          getEmployees(),
        ]);

        setDepartments(departmentData);
        setEmployees(employeeData);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load report filters."
        );
      } finally {
        setFiltersLoading(false);
      }
    }

    loadInitialData();
  }, []);

  /* ==========================================
     DEPARTMENT EMPLOYEE FILTER
     ========================================== */

  useEffect(() => {
    async function loadEmployeesForDepartment() {
      try {
        const data =
          await getEmployees(
            undefined,
            department || undefined
          );

        setEmployees(data);

        setSelectedEmployeeNo(
          (currentEmployeeNo) => {
            if (!currentEmployeeNo) {
              return "";
            }

            const employeeStillExists =
              data.some(
                (employee) =>
                  employee.empNo ===
                  currentEmployeeNo
              );

            return employeeStillExists
              ? currentEmployeeNo
              : "";
          }
        );
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load employees."
        );
      }
    }

    loadEmployeesForDepartment();
  }, [department]);

  /* ==========================================
     CURRENT EMPLOYEE
     ========================================== */

  const selectedEmployee =
    useMemo(
      () =>
        employees.find(
          (employee) =>
            employee.empNo ===
            selectedEmployeeNo
        ) ?? null,
      [
        employees,
        selectedEmployeeNo,
      ]
    );

  /* ==========================================
     REPORT TITLE
     ========================================== */

  const reportTitle =
    useMemo(
      () =>
        getReportTitle(
          reportType
        ),
      [reportType]
    );

  /* ==========================================
     GENERATE REPORT
     ========================================== */

  async function handleGenerate() {
    setError(null);

    if (!dateFrom || !dateTo) {
      setError(
        "Please select both From and To dates."
      );

      return;
    }

    if (dateFrom > dateTo) {
      setError(
        "From date cannot be after To date."
      );

      return;
    }

    setLoading(true);

    try {
      const data =
        await getReport(
          reportType,
          dateFrom,
          dateTo,
          department || undefined,
          selectedEmployeeNo || undefined
        );

      setReport(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate report."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================
     RESET FILTERS
     ========================================== */

  function handleReset() {
    setReportType("daily");

    setDateFrom("2026-09-01");
    setDateTo("2026-09-30");

    setDepartment("");
    setSelectedEmployeeNo("");

    setReport(null);
    setError(null);
  }

  /* ==========================================
     PRINT
     ========================================== */

  function handlePrint() {
    if (!report) {
      return;
    }

    window.print();
  }

  return (
    <main className="main-content">
      {/* ======================================
          HEADER
          ====================================== */}

      <header className="page-header reports-page-header">
        <div>
          <span className="eyebrow">
            Attendance Management
          </span>

          <h1>Reports</h1>

          <p>
            Generate attendance reports
            by employee, department and
            date range.
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={handlePrint}
          disabled={!report}
        >
          Print Report
        </button>
      </header>

      {/* ======================================
          FILTERS
          ====================================== */}

      <section className="report-filter-card">
        <div className="reports-filter-heading">
          <div>
            <h2>
              Report Filters
            </h2>

            <p>
              Select the report type and
              filters you want to use.
            </p>
          </div>

          <button
            type="button"
            className="reports-reset-button"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>

        <div className="reports-filter-grid">
          {/* REPORT TYPE */}

          <div className="field">
            <label>
              Report Type
            </label>

            <select
              value={reportType}
              onChange={(e) => {
                setReportType(
                  e.target
                    .value as ReportType
                );

                setReport(null);
              }}
            >
              <option value="daily">
                Daily Attendance
              </option>

              <option value="monthly">
                Monthly Summary
              </option>

              <option value="late">
                Late Employees
              </option>

              <option value="absent">
                Absent Employees
              </option>

              <option value="missing">
                Missing Punches
              </option>

              <option value="ot">
                Overtime
              </option>
            </select>
          </div>

          {/* DEPARTMENT */}

          <div className="field">
            <label>
              Department
            </label>

            <select
              value={department}
              disabled={filtersLoading}
              onChange={(e) => {
                setDepartment(
                  e.target.value
                );

                setReport(null);
              }}
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
          </div>

          {/* EMPLOYEE */}

          <div className="field reports-employee-field">
            <label>
              Employee
            </label>

            <select
              value={
                selectedEmployeeNo
              }
              disabled={
                filtersLoading
              }
              onChange={(e) => {
                setSelectedEmployeeNo(
                  e.target.value
                );

                setReport(null);
              }}
            >
              <option value="">
                All Employees
              </option>

              {employees.map(
                (employee) => (
                  <option
                    key={
                      employee.empNo
                    }
                    value={
                      employee.empNo
                    }
                  >
                    {employee.empNo}
                    {" - "}
                    {employee.name}
                  </option>
                )
              )}
            </select>

            {selectedEmployee && (
              <small className="reports-selected-employee">
                {selectedEmployee.department ||
                  "No department"}
                {selectedEmployee.shift
                  ? ` • Shift ${selectedEmployee.shift}`
                  : ""}
              </small>
            )}
          </div>

          {/* FROM */}

          <div className="field">
            <label>
              From
            </label>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(
                  e.target.value
                );

                setReport(null);
              }}
            />
          </div>

          {/* TO */}

          <div className="field">
            <label>
              To
            </label>

            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(
                  e.target.value
                );

                setReport(null);
              }}
            />
          </div>

          {/* GENERATE */}

          <div className="button-field">
            <button
              type="button"
              className="primary-button"
              onClick={
                handleGenerate
              }
              disabled={
                loading ||
                filtersLoading
              }
            >
              {loading
                ? "Generating..."
                : "Generate Report"}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </section>

      {/* ======================================
          NO REPORT YET
          ====================================== */}

      {!report && !loading && (
        <section className="reports-empty-state">
          <div className="reports-empty-icon">
            ▤
          </div>

          <h2>
            Generate a report
          </h2>

          <p>
            Select the report type,
            department, employee and date
            range above.
          </p>
        </section>
      )}

      {/* ======================================
          LOADING
          ====================================== */}

      {loading && (
        <section className="reports-loading-state">
          <div className="dashboard-loader" />

          <strong>
            Generating report...
          </strong>

          <span>
            Retrieving attendance records.
          </span>
        </section>
      )}

      {/* ======================================
          REPORT RESULT
          ====================================== */}

      {report && !loading && (
        <>
          <section className="reports-summary">
            <ReportSummaryCards
              report={report}
            />
          </section>

          <section className="report-card reports-result-card">
            <div className="report-heading">
              <div>
                <span className="dashboard-section-label">
                  Attendance Report
                </span>

                <h2>
                  {reportTitle}
                </h2>

                <p>
                  {formatDate(
                    report.dateFrom
                  )}
                  {" — "}
                  {formatDate(
                    report.dateTo
                  )}
                </p>
              </div>

              <div className="reports-result-meta">
                <span>
                  {report.rows.length}{" "}
                  records
                </span>

                {department && (
                  <span>
                    Department:{" "}
                    {getDepartmentName(
                      departments,
                      department
                    )}
                  </span>
                )}

                {selectedEmployee && (
                  <span>
                    Employee:{" "}
                    {
                      selectedEmployee.empNo
                    }
                  </span>
                )}
              </div>
            </div>

            {report.type ===
            "monthly" ? (
              <MonthlyReportTable
                rows={
                  report.rows as MonthlyReportRow[]
                }
              />
            ) : (
              <DetailReportTable
                rows={
                  report.rows as ReportRow[]
                }
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}

/* =====================================================
   REPORT SUMMARY
   ===================================================== */

function ReportSummaryCards({
  report,
}: {
  report: ReportResponse;
}) {
  if (
    report.type === "monthly"
  ) {
    const rows =
      report.rows as MonthlyReportRow[];

    const totalPresent =
      rows.reduce(
        (
          total,
          row
        ) =>
          total +
          row.presentDays,
        0
      );

    const totalAbsent =
      rows.reduce(
        (
          total,
          row
        ) =>
          total +
          row.absentDays,
        0
      );

    const totalLate =
      rows.reduce(
        (
          total,
          row
        ) =>
          total +
          row.lateDays,
        0
      );

    const totalMissing =
      rows.reduce(
        (
          total,
          row
        ) =>
          total +
          row.missingCheckIn +
          row.missingCheckOut,
        0
      );

    return (
      <div className="reports-summary-grid">
        <ReportStat
          label="Employees"
          value={
            report.summary
              .employeeCount ??
            rows.length
          }
        />

        <ReportStat
          label="Present Days"
          value={totalPresent}
          type="present"
        />

        <ReportStat
          label="Absent Days"
          value={totalAbsent}
          type="absent"
        />

        <ReportStat
          label="Late Days"
          value={totalLate}
          type="late"
        />

        <ReportStat
          label="Missing Punches"
          value={totalMissing}
          type="missing"
        />
      </div>
    );
  }

  return (
    <div className="reports-summary-grid">
      <ReportStat
        label="Records"
        value={
          report.summary
            .recordCount ?? 0
        }
      />

      <ReportStat
        label="Present"
        value={
          report.summary.present ??
          0
        }
        type="present"
      />

      <ReportStat
        label="Absent"
        value={
          report.summary.absent ??
          0
        }
        type="absent"
      />

      <ReportStat
        label="Late"
        value={
          report.summary.late ??
          0
        }
        type="late"
      />

      <ReportStat
        label="Missing In"
        value={
          report.summary
            .missingCheckIn ?? 0
        }
        type="missing"
      />

      <ReportStat
        label="Missing Out"
        value={
          report.summary
            .missingCheckOut ?? 0
        }
        type="missing"
      />

      <ReportStat
        label="Late Time"
        value={
          report.summary
            .totalLate ??
          "0:00"
        }
        subtitle="Hours"
        type="late"
      />

      <ReportStat
        label="Early Time"
        value={
          report.summary
            .totalEarly ??
          "0:00"
        }
        subtitle="Hours"
        type="early"
      />

      <ReportStat
        label="Total OT"
        value={
          report.summary.totalOT ??
          "0:00"
        }
        subtitle="Hours"
        type="ot"
      />
    </div>
  );
}

/* =====================================================
   STAT CARD
   ===================================================== */

function ReportStat({
  label,
  value,
  subtitle,
  type = "default",
}: {
  label: string;
  value: number | string;
  subtitle?: string;

  type?:
    | "default"
    | "present"
    | "absent"
    | "late"
    | "early"
    | "missing"
    | "ot";
}) {
  return (
    <div
      className={`report-stat report-stat-${type}`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      {subtitle && (
        <small>
          {subtitle}
        </small>
      )}
    </div>
  );
}

/* =====================================================
   DETAIL REPORT TABLE
   ===================================================== */

function DetailReportTable({
  rows,
}: {
  rows: ReportRow[];
}) {
  return (
    <div className="table-wrapper reports-table-wrapper">
      <table className="attendance-table reports-table">
        <thead>
          <tr>
            <th>Date</th>
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
                colSpan={11}
                className="empty-row"
              >
                No report records found.
              </td>
            </tr>
          ) : (
            rows.map(
              (
                row,
                index
              ) => (
                <tr
                  key={`${row.empNo}-${row.date}-${index}`}
                >
                  <td>
                    {formatDate(
                      row.date
                    )}
                  </td>

                  <td>
                    <div className="report-employee-cell">
                      <strong>
                        {row.name ||
                          "Unknown"}
                      </strong>

                      <span>
                        {row.empNo ||
                          "-"}
                      </span>
                    </div>
                  </td>

                  <td>
                    {row.department ||
                      "-"}
                  </td>

                  <td>
                    {displayValue(
                      row.shiftIn
                    )}
                  </td>

                  <td>
                    {renderTimeIn(
                      row.timeIn
                    )}
                  </td>

                  <td>
                    {displayValue(
                      row.shiftOut
                    )}
                  </td>

                  <td>
                    {displayValue(
                      row.timeOut
                    )}
                  </td>

                  <td>
                    <ReportMetric
                      value={
                        row.late
                      }
                      type="late"
                    />
                  </td>

                  <td>
                    <ReportMetric
                      value={
                        row.early
                      }
                      type="early"
                    />
                  </td>

                  <td>
                    <ReportMetric
                      value={row.ot}
                      type="ot"
                    />
                  </td>

                  <td>
                    <ReportStatus
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
   MONTHLY TABLE
   ===================================================== */

function MonthlyReportTable({
  rows,
}: {
  rows: MonthlyReportRow[];
}) {
  return (
    <div className="table-wrapper reports-table-wrapper">
      <table className="attendance-table reports-table monthly-report-table">
        <thead>
          <tr>
            <th>
              Employee
            </th>

            <th>
              Department
            </th>

            <th>
              Present
            </th>

            <th>
              Absent
            </th>

            <th>
              Late
            </th>

            <th>
              Missing In
            </th>

            <th>
              Missing Out
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="empty-row"
              >
                No monthly attendance
                records found.
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
                    <div className="report-employee-cell">
                      <strong>
                        {row.name ||
                          "Unknown"}
                      </strong>

                      <span>
                        {row.empNo ||
                          "-"}
                      </span>
                    </div>
                  </td>

                  <td>
                    {row.department ||
                      "-"}
                  </td>

                  <td>
                    <span className="report-value present">
                      {
                        row.presentDays
                      }
                    </span>
                  </td>

                  <td>
                    <span className="report-value absent">
                      {
                        row.absentDays
                      }
                    </span>
                  </td>

                  <td>
                    <span className="report-value late">
                      {
                        row.lateDays
                      }
                    </span>
                  </td>

                  <td>
                    <span className="report-value missing">
                      {
                        row.missingCheckIn
                      }
                    </span>
                  </td>

                  <td>
                    <span className="report-value missing">
                      {
                        row.missingCheckOut
                      }
                    </span>
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
   REPORT STATUS
   ===================================================== */

function ReportStatus({
  status,
}: {
  status: string;
}) {
  const normalized =
    status
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );

  return (
    <span
      className={`reports-status reports-status-${normalized}`}
    >
      <span className="status-dot" />

      {status}
    </span>
  );
}

/* =====================================================
   REPORT METRIC
   ===================================================== */

function ReportMetric({
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

function displayValue(
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
    value.toUpperCase() ===
    "AB"
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

function formatDate(
  date: string
) {
  if (!date) {
    return "-";
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getDepartmentName(
  departments: Department[],
  code: string
) {
  return (
    departments.find(
      (department) =>
        department.code ===
        code
    )?.name ?? code
  );
}

function getReportTitle(
  type: ReportType
) {
  switch (type) {
    case "daily":
      return "Daily Attendance Report";

    case "monthly":
      return "Monthly Attendance Summary";

    case "late":
      return "Late Employees Report";

    case "absent":
      return "Absent Employees Report";

    case "missing":
      return "Missing Punch Report";

    case "ot":
      return "Overtime Report";

    default:
      return "Attendance Report";
  }
}

export default ReportsPage;