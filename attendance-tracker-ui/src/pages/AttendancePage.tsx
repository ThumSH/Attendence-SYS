import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import EmployeePicker from "../components/EmployeePicker";
import CompanyBrand from "../components/CompanyBrand";

import {
  deleteAttendanceAnnotation,
  getAttendance,
  getAttendanceAnnotations,
  getDepartments,
  getEmployees,
  saveAttendanceAnnotation,
} from "../services/api";

import {
  buildReportFileName,
  exportToExcel,
  type ExportColumn,
} from "../utils/reportExport";

import type {
  AttendanceAnnotation,
  AttendanceAnnotationField,
  AttendanceReport,
  AttendanceRow,
  Department,
  Employee,
} from "../types/attendance";

type QuickRange =
  | "month"
  | "30days";


interface AttendanceExportRow {
  date: string;
  shiftIn: string;
  timeIn: string;
  shiftOut: string;
  timeOut: string;
  late: string;
  early: string;
  ot: string;
  status: string;
}

const ATTENDANCE_EXPORT_COLUMNS: ExportColumn<AttendanceExportRow>[] = [
  { key: "date", label: "Date" },
  { key: "shiftIn", label: "Shift In" },
  { key: "timeIn", label: "Time In" },
  { key: "shiftOut", label: "Shift Out" },
  { key: "timeOut", label: "Time Out" },
  { key: "late", label: "Late" },
  { key: "early", label: "Early" },
  { key: "ot", label: "OT" },
  { key: "status", label: "Status" },
];

const ABSENCE_REASON_OPTIONS = [
  "Fever",
  "Poya Day",
  "Mercantile Holiday",
  "Company Leave",
  "Thai Pongal",
  "Christmas",
  "New Year",
] as const;

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
    annotations,
    setAnnotations,
  ] =
    useState<AttendanceAnnotation[]>([]);

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
          await getEmployees();

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
  }, []);

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
        const [
          data,
          annotationData,
        ] =
          await Promise.all([
            getAttendance(
              selectedEmployee,
              from,
              to
            ),
            getAttendanceAnnotations(
              selectedEmployee,
              from,
              to
            ),
          ]);

        if (!cancelled) {
          setReport(data);
          setAnnotations(
            annotationData
          );
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
      const [
        data,
        annotationData,
      ] =
        await Promise.all([
          getAttendance(
            selectedEmployee,
            from,
            to
          ),
          getAttendanceAnnotations(
            selectedEmployee,
            from,
            to
          ),
        ]);

      setReport(data);
      setAnnotations(
        annotationData
      );

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
    setAnnotations([]);
    autoLoadedReport.current = null;
  }

  function handleEmployeeChange(
    empNo: string
  ) {
    setSelectedEmployee(empNo);
    setReport(null);
    setAnnotations([]);
    autoLoadedReport.current = null;
  }

  function handleFromChange(
    value: string
  ) {
    setFrom(value);
    setReport(null);
    setAnnotations([]);
    autoLoadedReport.current = null;
  }

  function handleToChange(
    value: string
  ) {
    setTo(value);
    setReport(null);
    setAnnotations([]);
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
    setAnnotations([]);
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
    setAnnotations([]);
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

  const pickerEmployees =
    useMemo(() => {
      if (!department) {
        return employees;
      }

      const matching =
        employees.filter(
          (employee) =>
            employee.departmentCode ===
            department
        );

      const others =
        employees.filter(
          (employee) =>
            employee.departmentCode !==
            department
        );

      return [
        ...matching,
        ...others,
      ];
    }, [
      employees,
      department,
    ]);

  async function handleSaveAnnotation(
    attendanceDate: string,
    fieldName: AttendanceAnnotationField,
    reason: string
  ) {
    if (!report) {
      return;
    }

    try {
      const saved =
        await saveAttendanceAnnotation({
          empNo:
            report.employee.empNo,
          attendanceDate,
          fieldName,
          reason,
        });

      setAnnotations(
        (current) => [
          ...current.filter(
            (item) =>
              !(
                item.attendanceDate ===
                  saved.attendanceDate &&
                item.fieldName ===
                  saved.fieldName
              )
          ),
          saved,
        ]
      );

      setError(null);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to save the attendance reason."
      );

      throw err;
    }
  }

  async function handleDeleteAnnotation(
    annotation: AttendanceAnnotation
  ) {
    try {
      await deleteAttendanceAnnotation(
        annotation.id
      );

      setAnnotations(
        (current) =>
          current.filter(
            (item) =>
              item.id !== annotation.id
          )
      );

      setError(null);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to remove the attendance reason."
      );

      throw err;
    }
  }

  function handleExcelExport() {
    if (!report) {
      return;
    }

    const rows: AttendanceExportRow[] =
      report.attendance.map(
        (row) => ({
          date: row.date,
          shiftIn:
            getDisplayExportValue(
              row,
              "ShiftIn",
              annotations
            ),
          timeIn:
            getDisplayExportValue(
              row,
              "TimeIn",
              annotations
            ),
          shiftOut:
            getDisplayExportValue(
              row,
              "ShiftOut",
              annotations
            ),
          timeOut:
            getDisplayExportValue(
              row,
              "TimeOut",
              annotations
            ),
          late:
            getDisplayExportValue(
              row,
              "Late",
              annotations
            ),
          early:
            getDisplayExportValue(
              row,
              "Early",
              annotations
            ),
          ot:
            getDisplayExportValue(
              row,
              "Ot",
              annotations
            ),
          status: row.status,
        })
      );

    exportToExcel<AttendanceExportRow>({
      rows,
      columns:
        ATTENDANCE_EXPORT_COLUMNS,
      fileName:
        buildReportFileName(
          `Individual_Attendance_${report.employee.empNo}`,
          report.employee.dateFrom,
          report.employee.dateTo
        ),
      sheetName:
        "Individual Attendance",
    });
  }

  return (
    <main className="main-content attendance-v2">
      <style>
        {`
          @media print {
            .attendance-v2-status-column {
              display: none !important;
            }

            .attendance-v2-annotation-edit-hint,
            .attendance-v2-annotation-editor {
              display: none !important;
            }
          }
        `}
      </style>

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

        <div className="attendance-v2-export-actions">
          <button
            type="button"
            className="attendance-v2-excel-button"
            onClick={handleExcelExport}
            disabled={!report}
          >
            <span>
              XLS
            </span>

            Export Excel
          </button>

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

            Print / PDF
          </button>
        </div>
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
              employees={pickerEmployees}
              value={
                selectedEmployee
              }
              onChange={
                handleEmployeeChange
              }
            />

            {loadingEmployees ? (
              <small>
                Updating employee list...
              </small>
            ) : (
              <small>
                Search all employees by name,
                number or department.
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
            annotations={annotations}
            refreshing={loading}
            onSaveAnnotation={
              handleSaveAnnotation
            }
            onDeleteAnnotation={
              handleDeleteAnnotation
            }
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
  annotations,
  refreshing,
  onSaveAnnotation,
  onDeleteAnnotation,
}: {
  report: AttendanceReport;
  annotations: AttendanceAnnotation[];
  refreshing: boolean;
  onSaveAnnotation: (
    attendanceDate: string,
    fieldName: AttendanceAnnotationField,
    reason: string
  ) => Promise<void>;
  onDeleteAnnotation: (
    annotation: AttendanceAnnotation
  ) => Promise<void>;
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

      <div className="attendance-v2-annotation-note">
        <strong>
          Attendance reasons
        </strong>

        <span>
          Empty or AB cells can be annotated.
          These notes are stored in the Attendance
          Tracker database and do not change SCS.
        </span>
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

              <th className="attendance-v2-status-column">
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
                    annotations={
                      annotations
                    }
                    onSaveAnnotation={
                      onSaveAnnotation
                    }
                    onDeleteAnnotation={
                      onDeleteAnnotation
                    }
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

                <td className="attendance-v2-status-column">
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
  annotations,
  onSaveAnnotation,
  onDeleteAnnotation,
}: {
  row: AttendanceRow;
  annotations: AttendanceAnnotation[];
  onSaveAnnotation: (
    attendanceDate: string,
    fieldName: AttendanceAnnotationField,
    reason: string
  ) => Promise<void>;
  onDeleteAnnotation: (
    annotation: AttendanceAnnotation
  ) => Promise<void>;
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
        <EditableAttendanceCell
          row={row}
          fieldName="ShiftIn"
          value={row.shiftIn}
          annotations={annotations}
          onSave={onSaveAnnotation}
          onDelete={onDeleteAnnotation}
        >
          {displayValue(
            row.shiftIn
          )}
        </EditableAttendanceCell>
      </td>

      <td>
        <EditableAttendanceCell
          row={row}
          fieldName="TimeIn"
          value={row.timeIn}
          annotations={annotations}
          onSave={onSaveAnnotation}
          onDelete={onDeleteAnnotation}
        >
          {renderAttendanceTime(
            row.timeIn
          )}
        </EditableAttendanceCell>
      </td>

      <td>
        <EditableAttendanceCell
          row={row}
          fieldName="ShiftOut"
          value={row.shiftOut}
          annotations={annotations}
          onSave={onSaveAnnotation}
          onDelete={onDeleteAnnotation}
        >
          {displayValue(
            row.shiftOut
          )}
        </EditableAttendanceCell>
      </td>

      <td>
        <EditableAttendanceCell
          row={row}
          fieldName="TimeOut"
          value={row.timeOut}
          annotations={annotations}
          onSave={onSaveAnnotation}
          onDelete={onDeleteAnnotation}
        >
          {renderMissingTime(
            row.timeOut,
            row.status ===
              "Missing Check-Out"
          )}
        </EditableAttendanceCell>
      </td>

      <td>
        <EditableAttendanceCell
          row={row}
          fieldName="Late"
          value={row.late}
          annotations={annotations}
          onSave={onSaveAnnotation}
          onDelete={onDeleteAnnotation}
        >
          <MetricValue
            value={row.late}
            type="late"
          />
        </EditableAttendanceCell>
      </td>

      <td>
        <EditableAttendanceCell
          row={row}
          fieldName="Early"
          value={row.early}
          annotations={annotations}
          onSave={onSaveAnnotation}
          onDelete={onDeleteAnnotation}
        >
          <MetricValue
            value={row.early}
            type="early"
          />
        </EditableAttendanceCell>
      </td>

      <td>
        <EditableAttendanceCell
          row={row}
          fieldName="Ot"
          value={row.ot}
          annotations={annotations}
          onSave={onSaveAnnotation}
          onDelete={onDeleteAnnotation}
        >
          <MetricValue
            value={row.ot}
            type="ot"
          />
        </EditableAttendanceCell>
      </td>

      <td className="attendance-v2-status-column">
        <StatusBadge
          status={row.status}
        />
      </td>
    </tr>
  );
}

function EditableAttendanceCell({
  row,
  fieldName,
  value,
  annotations,
  onSave,
  onDelete,
  children,
}: {
  row: AttendanceRow;
  fieldName: AttendanceAnnotationField;
  value: string | null;
  annotations: AttendanceAnnotation[];
  onSave: (
    attendanceDate: string,
    fieldName: AttendanceAnnotationField,
    reason: string
  ) => Promise<void>;
  onDelete: (
    annotation: AttendanceAnnotation
  ) => Promise<void>;
  children: ReactNode;
}) {
  const annotation =
    findAnnotation(
      annotations,
      row.date,
      fieldName
    );

  const [
    editing,
    setEditing,
  ] =
    useState(false);

  const [
    selectedReason,
    setSelectedReason,
  ] =
    useState("");

  const [
    customReason,
    setCustomReason,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    localError,
    setLocalError,
  ] =
    useState<string | null>(null);

  const editable =
    Boolean(annotation) ||
    isAnnotatableValue(value);

  function openEditor() {
    const existingReason =
      annotation?.reason?.trim() ?? "";

    const knownReason =
      ABSENCE_REASON_OPTIONS.some(
        (reason) =>
          reason === existingReason
      );

    setSelectedReason(
      knownReason
        ? existingReason
        : existingReason
          ? "Other"
          : ""
    );

    setCustomReason(
      knownReason
        ? ""
        : existingReason
    );

    setLocalError(null);
    setEditing(true);
  }

  async function handleSave() {
    const reason =
      selectedReason === "Other"
        ? customReason.trim()
        : selectedReason.trim();

    if (!reason) {
      setLocalError(
        "Select or enter a reason."
      );

      return;
    }

    setSaving(true);
    setLocalError(null);

    try {
      await onSave(
        row.date,
        fieldName,
        reason
      );

      setEditing(false);
    } catch {
      setLocalError(
        "Unable to save reason."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!annotation) {
      return;
    }

    setSaving(true);
    setLocalError(null);

    try {
      await onDelete(annotation);

      setEditing(false);
    } catch {
      setLocalError(
        "Unable to remove reason."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!editable) {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <div className="attendance-v2-editable-cell">
      <button
        type="button"
        className={
          annotation
            ? "attendance-v2-annotation-value"
            : "attendance-v2-annotation-trigger"
        }
        onClick={openEditor}
        title={
          annotation
            ? "Edit attendance reason"
            : "Add attendance reason"
        }
      >
        {annotation ? (
          <strong>
            {annotation.reason}
          </strong>
        ) : (
          <>
            <span>
              {children}
            </span>

            <small className="attendance-v2-annotation-edit-hint">
              Add reason
            </small>
          </>
        )}
      </button>

      {editing && (
        <div className="attendance-v2-annotation-editor">
          <strong>
            Attendance reason
          </strong>

          <select
            value={selectedReason}
            onChange={(event) =>
              setSelectedReason(
                event.target.value
              )
            }
            disabled={saving}
          >
            <option value="">
              Select reason
            </option>

            {ABSENCE_REASON_OPTIONS.map(
              (reason) => (
                <option
                  key={reason}
                  value={reason}
                >
                  {reason}
                </option>
              )
            )}

            <option value="Other">
              Other / Custom
            </option>
          </select>

          {selectedReason ===
            "Other" && (
            <input
              type="text"
              value={customReason}
              placeholder="Enter custom reason"
              maxLength={200}
              disabled={saving}
              onChange={(event) =>
                setCustomReason(
                  event.target.value
                )
              }
            />
          )}

          {localError && (
            <small className="attendance-v2-annotation-error">
              {localError}
            </small>
          )}

          <div className="attendance-v2-annotation-actions">
            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save"}
            </button>

            {annotation && (
              <button
                type="button"
                className="danger"
                onClick={() =>
                  void handleDelete()
                }
                disabled={saving}
              >
                Remove
              </button>
            )}

            <button
              type="button"
              className="secondary"
              onClick={() =>
                setEditing(false)
              }
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
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
      <div className="attendance-v2-print-brand-row">
        <CompanyBrand
          variant="print"
        />

        <div className="attendance-v2-print-title">
          <span>
            Attendance Report
          </span>

          <h1>
            Individual Attendance Summary
          </h1>
        </div>
      </div>

      <div className="attendance-v2-print-info">
        <div>
          <span>
            Employee
          </span>

          <strong>
            {report.employee.empNo}
            {" · "}
            {report.employee.name}
          </strong>
        </div>

        <div>
          <span>
            Department
          </span>

          <strong>
            {report.employee.department || "-"}
          </strong>
        </div>

        <div>
          <span>
            Date From
          </span>

          <strong>
            {report.employee.dateFrom}
          </strong>
        </div>

        <div>
          <span>
            Date To
          </span>

          <strong>
            {report.employee.dateTo}
          </strong>
        </div>
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

function findAnnotation(
  annotations: AttendanceAnnotation[],
  attendanceDate: string,
  fieldName: AttendanceAnnotationField
) {
  return (
    annotations.find(
      (annotation) =>
        annotation.attendanceDate ===
          attendanceDate &&
        annotation.fieldName ===
          fieldName
    ) ?? null
  );
}

function isAnnotatableValue(
  value: string | null
) {
  if (!value?.trim()) {
    return true;
  }

  return (
    value.trim().toLowerCase() ===
    "ab"
  );
}

function getRowFieldValue(
  row: AttendanceRow,
  fieldName: AttendanceAnnotationField
) {
  switch (fieldName) {
    case "ShiftIn":
      return row.shiftIn;

    case "TimeIn":
      return row.timeIn;

    case "ShiftOut":
      return row.shiftOut;

    case "TimeOut":
      return row.timeOut;

    case "Late":
      return row.late;

    case "Early":
      return row.early;

    case "Ot":
      return row.ot;
  }
}

function getDisplayExportValue(
  row: AttendanceRow,
  fieldName: AttendanceAnnotationField,
  annotations: AttendanceAnnotation[]
) {
  const annotation =
    findAnnotation(
      annotations,
      row.date,
      fieldName
    );

  if (annotation) {
    return annotation.reason;
  }

  return (
    getRowFieldValue(
      row,
      fieldName
    )?.trim() ?? ""
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
