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

import CompanyBrand from "../components/CompanyBrand";

interface ReportTypeOption {
  value: ReportType;
  label: string;
  description: string;
  icon: string;
}

const REPORT_TYPES: ReportTypeOption[] = [
  {
    value: "daily",
    label: "Daily Attendance",
    description: "Full processed attendance records",
    icon: "▤",
  },
  {
    value: "monthly",
    label: "Monthly Summary",
    description: "Employee-level attendance totals",
    icon: "▦",
  },
  {
    value: "late",
    label: "Late Employees",
    description: "Late attendance records only",
    icon: "◷",
  },
  {
    value: "absent",
    label: "Absent Employees",
    description: "Employees marked absent",
    icon: "×",
  },
  {
    value: "missing",
    label: "Missing Punches",
    description: "Missing check-in or check-out",
    icon: "!",
  },
  {
    value: "ot",
    label: "Overtime",
    description: "Records containing overtime",
    icon: "+",
  },
];

function ReportsPage() {
  const defaultRange =
    useMemo(
      () => getDefaultDateRange(),
      []
    );

  const [
    reportType,
    setReportType,
  ] =
    useState<ReportType>(
      "daily"
    );

  const [
    dateFrom,
    setDateFrom,
  ] =
    useState(
      defaultRange.from
    );

  const [
    dateTo,
    setDateTo,
  ] =
    useState(
      defaultRange.to
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
    selectedEmployeeNo,
    setSelectedEmployeeNo,
  ] =
    useState("");

  const [
    report,
    setReport,
  ] =
    useState<ReportResponse | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    filtersLoading,
    setFiltersLoading,
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

        if (!cancelled) {
          setDepartments(data);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Unable to load report departments."
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
      setFiltersLoading(true);

      try {
        const data =
          await getEmployees(
            undefined,
            department ||
              undefined
          );

        if (cancelled) {
          return;
        }

        setEmployees(data);

        setSelectedEmployeeNo(
          (current) => {
            if (!current) {
              return "";
            }

            const stillExists =
              data.some(
                (employee) =>
                  employee.empNo ===
                  current
              );

            return stillExists
              ? current
              : "";
          }
        );
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Unable to load report employees."
          );
        }
      } finally {
        if (!cancelled) {
          setFiltersLoading(false);
        }
      }
    }

    void loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [department]);

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

  const reportTypeOption =
    useMemo(
      () =>
        REPORT_TYPES.find(
          (item) =>
            item.value ===
            reportType
        ) ??
        REPORT_TYPES[0],
      [reportType]
    );

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
          department ||
            undefined,
          selectedEmployeeNo ||
            undefined
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

  function handleReset() {
    const dates =
      getDefaultDateRange();

    setReportType("daily");
    setDateFrom(dates.from);
    setDateTo(dates.to);
    setDepartment("");
    setSelectedEmployeeNo("");
    setReport(null);
    setError(null);
  }

  function handleReportTypeChange(
    value: ReportType
  ) {
    setReportType(value);
    setReport(null);
  }

  function handleDepartmentChange(
    value: string
  ) {
    setDepartment(value);
    setSelectedEmployeeNo("");
    setReport(null);
  }

  function handleEmployeeChange(
    value: string
  ) {
    setSelectedEmployeeNo(
      value
    );

    setReport(null);
  }

  function handleDateFromChange(
    value: string
  ) {
    setDateFrom(value);
    setReport(null);
  }

  function handleDateToChange(
    value: string
  ) {
    setDateTo(value);
    setReport(null);
  }

  function applyThisMonth() {
    const dates =
      getDefaultDateRange();

    setDateFrom(dates.from);
    setDateTo(dates.to);
    setReport(null);
  }

  function applyLast30Days() {
    const dates =
      getLast30DaysRange();

    setDateFrom(dates.from);
    setDateTo(dates.to);
    setReport(null);
  }

  function handlePrint() {
    if (report) {
      window.print();
    }
  }

  return (
    <main className="main-content reports-v2">
      <header className="reports-v2-header">
        <div>
          <span className="reports-v2-eyebrow">
            Attendance Management
          </span>

          <h1>
            Reports
          </h1>

          <p>
            Generate processed attendance
            reports by report type,
            employee, department and
            date range.
          </p>
        </div>

        <button
          type="button"
          className="reports-v2-print-button"
          onClick={
            handlePrint
          }
          disabled={!report}
        >
          <span>
            ⎙
          </span>

          Print Report
        </button>
      </header>

      <ReportTypeSelector
        reportType={
          reportType
        }
        onChange={
          handleReportTypeChange
        }
      />

      <section className="reports-v2-filter-panel">
        <div className="reports-v2-filter-heading">
          <div>
            <span>
              Report Filters
            </span>

            <strong>
              {reportTypeOption.label}
            </strong>

            <small>
              {
                reportTypeOption.description
              }
            </small>
          </div>

          <div className="reports-v2-quick-actions">
            <button
              type="button"
              onClick={
                applyThisMonth
              }
            >
              This Month
            </button>

            <button
              type="button"
              onClick={
                applyLast30Days
              }
            >
              Last 30 Days
            </button>

            <button
              type="button"
              className="reports-v2-reset"
              onClick={
                handleReset
              }
            >
              Reset
            </button>
          </div>
        </div>

        <div className="reports-v2-filter-grid">
          <label className="reports-v2-field">
            <span>
              Department
            </span>

            <select
              value={department}
              disabled={
                filtersLoading
              }
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

          <label className="reports-v2-field reports-v2-employee-field">
            <span>
              Employee
            </span>

            <select
              value={
                selectedEmployeeNo
              }
              disabled={
                filtersLoading
              }
              onChange={(event) =>
                handleEmployeeChange(
                  event.target.value
                )
              }
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
                    {
                      employee.empNo
                    }
                    {" - "}
                    {
                      employee.name
                    }
                  </option>
                )
              )}
            </select>
          </label>

          <label className="reports-v2-field">
            <span>
              From
            </span>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) =>
                handleDateFromChange(
                  event.target.value
                )
              }
            />
          </label>

          <label className="reports-v2-field">
            <span>
              To
            </span>

            <input
              type="date"
              value={dateTo}
              onChange={(event) =>
                handleDateToChange(
                  event.target.value
                )
              }
            />
          </label>

          <button
            type="button"
            className="reports-v2-generate-button"
            onClick={() =>
              void handleGenerate()
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

        {(selectedDepartmentName ||
          selectedEmployee) && (
          <div className="reports-v2-active-filters">
            <span>
              Active Filters
            </span>

            {selectedDepartmentName && (
              <strong>
                Department:{" "}
                {
                  selectedDepartmentName
                }
              </strong>
            )}

            {selectedEmployee && (
              <strong>
                Employee:{" "}
                {
                  selectedEmployee.empNo
                }{" "}
                ·{" "}
                {
                  selectedEmployee.name
                }
              </strong>
            )}
          </div>
        )}

        {error && (
          <div className="reports-v2-error">
            <strong>
              Unable to generate report
            </strong>

            <span>
              {error}
            </span>
          </div>
        )}
      </section>

      {!report && !loading && (
        <ReportEmptyState />
      )}

      {loading && (
        <ReportLoadingState />
      )}

      {report && !loading && (
        <>
          <ReportPrintHeader
            report={report}
            reportTitle={
              getReportTitle(
                report.type
              )
            }
            departmentName={
              selectedDepartmentName
            }
            employee={
              selectedEmployee
            }
          />

          <ReportSummaryCards
            report={report}
          />

          <ReportResult
            report={report}
            title={
              getReportTitle(
                report.type
              )
            }
            departmentName={
              selectedDepartmentName
            }
            employee={
              selectedEmployee
            }
          />
        </>
      )}
    </main>
  );
}

function ReportTypeSelector({
  reportType,
  onChange,
}: {
  reportType: ReportType;

  onChange:
    (value: ReportType) =>
      void;
}) {
  return (
    <section className="reports-v2-type-grid">
      {REPORT_TYPES.map(
        (item) => (
          <button
            type="button"
            key={item.value}
            className={
              reportType ===
              item.value
                ? "reports-v2-type-card active"
                : "reports-v2-type-card"
            }
            onClick={() =>
              onChange(
                item.value
              )
            }
          >
            <span className="reports-v2-type-icon">
              {item.icon}
            </span>

            <span className="reports-v2-type-copy">
              <strong>
                {item.label}
              </strong>

              <small>
                {
                  item.description
                }
              </small>
            </span>
          </button>
        )
      )}
    </section>
  );
}

function ReportSummaryCards({
  report,
}: {
  report: ReportResponse;
}) {
  if (
    report.type ===
    "monthly"
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
      <section className="reports-v2-summary-grid reports-v2-summary-monthly">
        <ReportStat
          label="Employees"
          value={
            report.summary
              .employeeCount ??
            rows.length
          }
          caption="Employees in report"
          type="records"
        />

        <ReportStat
          label="Present Days"
          value={
            totalPresent
          }
          caption="Recorded present days"
          type="present"
        />

        <ReportStat
          label="Absent Days"
          value={
            totalAbsent
          }
          caption="Recorded absences"
          type="absent"
        />

        <ReportStat
          label="Late Days"
          value={
            totalLate
          }
          caption="Late attendance days"
          type="late"
        />

        <ReportStat
          label="Missing Punches"
          value={
            totalMissing
          }
          caption="Missing in + out"
          type="missing"
        />
      </section>
    );
  }

  return (
    <section className="reports-v2-summary-grid">
      <ReportStat
        label="Records"
        value={
          report.summary
            .recordCount ?? 0
        }
        caption="Rows in report"
        type="records"
      />

      <ReportStat
        label="Present"
        value={
          report.summary.present ??
          0
        }
        caption="Present records"
        type="present"
      />

      <ReportStat
        label="Absent"
        value={
          report.summary.absent ??
          0
        }
        caption="Absent records"
        type="absent"
      />

      <ReportStat
        label="Late"
        value={
          report.summary.late ??
          0
        }
        caption="Late records"
        type="late"
      />

      <ReportStat
        label="Missing In"
        value={
          report.summary
            .missingCheckIn ?? 0
        }
        caption="Missing check-in"
        type="missing"
      />

      <ReportStat
        label="Missing Out"
        value={
          report.summary
            .missingCheckOut ?? 0
        }
        caption="Missing check-out"
        type="missing"
      />

      <ReportStat
        label="Late Time"
        value={
          report.summary
            .totalLate ??
          "0:00"
        }
        caption={`${report.summary.totalLateMinutes ?? 0} minutes`}
        type="late"
      />

      <ReportStat
        label="Early Time"
        value={
          report.summary
            .totalEarly ??
          "0:00"
        }
        caption={`${report.summary.totalEarlyMinutes ?? 0} minutes`}
        type="early"
      />

      <ReportStat
        label="Total OT"
        value={
          report.summary
            .totalOT ??
          "0:00"
        }
        caption={`${report.summary.totalOtMinutes ?? 0} minutes`}
        type="ot"
      />
    </section>
  );
}

function ReportStat({
  label,
  value,
  caption,
  type,
}: {
  label: string;
  value: string | number;
  caption: string;

  type:
    | "records"
    | "present"
    | "absent"
    | "late"
    | "early"
    | "missing"
    | "ot";
}) {
  return (
    <article
      className={`reports-v2-stat ${type}`}
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

function ReportResult({
  report,
  title,
  departmentName,
  employee,
}: {
  report: ReportResponse;
  title: string;
  departmentName: string | null;
  employee: Employee | null;
}) {
  return (
    <section className="reports-v2-result-panel">
      <div className="reports-v2-result-heading">
        <div>
          <span>
            Attendance Report
          </span>

          <h2>
            {title}
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

        <div className="reports-v2-result-meta">
          <div>
            <strong>
              {
                report.rows.length
              }
            </strong>

            <span>
              records
            </span>
          </div>

          {departmentName && (
            <small>
              {
                departmentName
              }
            </small>
          )}

          {employee && (
            <small>
              {
                employee.empNo
              }
              {" · "}
              {
                employee.name
              }
            </small>
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
  );
}

function DetailReportTable({
  rows,
}: {
  rows: ReportRow[];
}) {
  return (
    <div className="reports-v2-table-wrapper">
      <table className="reports-v2-table reports-v2-detail-table">
        <thead>
          <tr>
            <th>
              Employee
            </th>

            <th>
              Department
            </th>

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
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={11}
                className="reports-v2-table-empty"
              >
                No records found for the
                selected report filters.
              </td>
            </tr>
          ) : (
            rows.map(
              (
                row,
                index
              ) => (
                <tr
                  key={`${row.empNo ?? "employee"}-${row.date}-${index}`}
                >
                  <td>
                    <EmployeeCell
                      empNo={
                        row.empNo
                      }
                      name={
                        row.name
                      }
                    />
                  </td>

                  <td>
                    <DepartmentCell
                      name={
                        row.department
                      }
                      code={
                        row.departmentCode
                      }
                    />
                  </td>

                  <td>
                    <DateCell
                      value={
                        row.date
                      }
                    />
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
                    {renderTimeOut(
                      row.timeOut,
                      row.status
                    )}
                  </td>

                  <td>
                    <MetricValue
                      value={
                        row.late
                      }
                      type="late"
                    />
                  </td>

                  <td>
                    <MetricValue
                      value={
                        row.early
                      }
                      type="early"
                    />
                  </td>

                  <td>
                    <MetricValue
                      value={
                        row.ot
                      }
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

function MonthlyReportTable({
  rows,
}: {
  rows: MonthlyReportRow[];
}) {
  return (
    <div className="reports-v2-table-wrapper">
      <table className="reports-v2-table reports-v2-monthly-table">
        <thead>
          <tr>
            <th>
              Employee
            </th>

            <th>
              Department
            </th>

            <th>
              Total Rows
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
                colSpan={8}
                className="reports-v2-table-empty"
              >
                No monthly records found
                for the selected filters.
              </td>
            </tr>
          ) : (
            rows.map(
              (
                row,
                index
              ) => (
                <tr
                  key={`${row.empNo ?? "employee"}-${index}`}
                >
                  <td>
                    <EmployeeCell
                      empNo={
                        row.empNo
                      }
                      name={
                        row.name
                      }
                    />
                  </td>

                  <td>
                    <DepartmentCell
                      name={
                        row.department
                      }
                      code={
                        row.departmentCode
                      }
                    />
                  </td>

                  <td>
                    <NumberBadge
                      value={
                        row.totalRows
                      }
                    />
                  </td>

                  <td>
                    <NumberBadge
                      value={
                        row.presentDays
                      }
                      type="present"
                    />
                  </td>

                  <td>
                    <NumberBadge
                      value={
                        row.absentDays
                      }
                      type="absent"
                    />
                  </td>

                  <td>
                    <NumberBadge
                      value={
                        row.lateDays
                      }
                      type="late"
                    />
                  </td>

                  <td>
                    <NumberBadge
                      value={
                        row.missingCheckIn
                      }
                      type="missing"
                    />
                  </td>

                  <td>
                    <NumberBadge
                      value={
                        row.missingCheckOut
                      }
                      type="missing"
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

function EmployeeCell({
  empNo,
  name,
}: {
  empNo: string | null;
  name: string | null;
}) {
  return (
    <div className="reports-v2-employee-cell">
      <div className="reports-v2-avatar">
        {getInitials(name)}
      </div>

      <div>
        <strong>
          {name ||
            "Unknown Employee"}
        </strong>

        <span>
          {empNo ||
            "—"}
        </span>
      </div>
    </div>
  );
}

function DepartmentCell({
  name,
  code,
}: {
  name: string | null;
  code: string | null;
}) {
  return (
    <div className="reports-v2-department-cell">
      <strong>
        {name ||
          "—"}
      </strong>

      {code && (
        <span>
          Code{" "}
          {code}
        </span>
      )}
    </div>
  );
}

function DateCell({
  value,
}: {
  value: string;
}) {
  const date =
    parseLocalDate(value);

  return (
    <div className="reports-v2-date-cell">
      <strong>
        {date.toLocaleDateString(
          "en-GB",
          {
            weekday: "short",
          }
        )}
      </strong>

      <span>
        {date.toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        )}
      </span>
    </div>
  );
}

function NumberBadge({
  value,
  type = "default",
}: {
  value: number;

  type?:
    | "default"
    | "present"
    | "absent"
    | "late"
    | "missing";
}) {
  return (
    <span
      className={`reports-v2-number ${type}`}
    >
      {value}
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
  if (isZeroMetric(value)) {
    return (
      <span className="reports-v2-empty-value">
        —
      </span>
    );
  }

  return (
    <span
      className={`reports-v2-metric ${type}`}
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
      className={`reports-v2-status ${getStatusClass(
        status
      )}`}
    >
      <i />

      {status}
    </span>
  );
}

function ReportEmptyState() {
  return (
    <section className="reports-v2-empty-state">
      <div>
        ▤
      </div>

      <h2>
        Generate a report
      </h2>

      <p>
        Choose a report type and filters
        above, then select Generate Report.
      </p>
    </section>
  );
}

function ReportLoadingState() {
  return (
    <section className="reports-v2-loading-state">
      <div className="reports-v2-spinner" />

      <strong>
        Generating report
      </strong>

      <span>
        Retrieving processed attendance
        records...
      </span>
    </section>
  );
}

function ReportPrintHeader({
  report,
  reportTitle,
  departmentName,
  employee,
}: {
  report: ReportResponse;
  reportTitle: string;
  departmentName: string | null;
  employee: Employee | null;
}) {
  return (
    <section className="reports-v2-print-header">
      <div className="reports-v2-print-brand-row">
        <CompanyBrand
          variant="print"
        />

        <div className="reports-v2-print-title">
          <span>
            Attendance Report
          </span>

          <h1>
            {reportTitle}
          </h1>
        </div>
      </div>

      <div className="reports-v2-print-info">
        <div>
          <span>
            Date From
          </span>

          <strong>
            {report.dateFrom}
          </strong>
        </div>

        <div>
          <span>
            Date To
          </span>

          <strong>
            {report.dateTo}
          </strong>
        </div>

        <div>
          <span>
            Department
          </span>

          <strong>
            {departmentName || "All Departments"}
          </strong>
        </div>

        <div>
          <span>
            Employee
          </span>

          <strong>
            {employee
              ? `${employee.empNo} · ${employee.name}`
              : "All Employees"}
          </strong>
        </div>
      </div>
    </section>
  );
}

function getReportTitle(
  type: ReportType
) {
  switch (type) {
    case "monthly":
      return "Monthly Attendance Summary";

    case "late":
      return "Late Employees Report";

    case "absent":
      return "Absent Employees Report";

    case "missing":
      return "Missing Punches Report";

    case "ot":
      return "Overtime Report";

    default:
      return "Daily Attendance Report";
  }
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

function formatDate(
  value: string
) {
  return parseLocalDate(
    value
  ).toLocaleDateString(
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
      <span className="reports-v2-empty-value">
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
      <span className="reports-v2-missing-time">
        Missing
      </span>
    );
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    normalized === "ab"
  ) {
    return (
      <span className="reports-v2-absent-time">
        AB
      </span>
    );
  }

  if (
    normalized === "sunday"
  ) {
    return (
      <span className="reports-v2-sunday-time">
        Sunday
      </span>
    );
  }

  return value;
}

function renderTimeOut(
  value: string | null,
  status: string
) {
  if (
    status ===
      "Missing Check-Out" &&
    (!value ||
      !value.trim())
  ) {
    return (
      <span className="reports-v2-missing-time">
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
  switch (
    status
      .trim()
      .toLowerCase()
  ) {
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

export default ReportsPage;
