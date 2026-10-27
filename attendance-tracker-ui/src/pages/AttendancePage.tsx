import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import AttendanceTable from "../components/AttendanceTable";
import EmployeePicker from "../components/EmployeePicker";
import SummaryCard from "../components/SummaryCard";

import {
  getAttendance,
  getDepartments,
  getEmployees,
} from "../services/api";

import type {
  AttendanceReport,
  Department,
  Employee,
} from "../types/attendance";

function AttendancePage() {
  /* =========================
     URL PARAMS
     ========================= */

  const [searchParams] =
    useSearchParams();

  const employeeFromUrl =
    searchParams.get("emp");

  /* =========================
     FILTER DATA
     ========================= */

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

  /* =========================
     FILTER STATE
     ========================= */

  const [
    department,
    setDepartment,
  ] =
    useState("");

  /*
    EmployeePicker currently works
    with an employee number string.
  */
  const [
    selectedEmployee,
    setSelectedEmployee,
  ] =
    useState("");

  const [
    from,
    setFrom,
  ] =
    useState("2026-09-01");

  const [
    to,
    setTo,
  ] =
    useState("2026-09-30");

  /* =========================
     REPORT STATE
     ========================= */

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
    error,
    setError,
  ] =
    useState<string | null>(null);

  /*
    Prevent the URL-driven report
    from loading repeatedly.
  */
  const autoLoadedEmployee =
    useRef<string | null>(null);

  /* =========================
     INITIAL DATA
     ========================= */

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
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
            "Unable to connect to the attendance API."
          );
        }
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================
     DEPARTMENT FILTER
     ========================= */

  useEffect(() => {
    let cancelled = false;

    async function loadEmployeesByDepartment() {
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

        setSelectedEmployee(
          (
            currentEmployee
          ) => {
            if (
              !currentEmployee
            ) {
              return "";
            }

            const stillExists =
              data.some(
                (employee) =>
                  employee.empNo ===
                  currentEmployee
              );

            if (
              stillExists
            ) {
              return currentEmployee;
            }

            setReport(null);

            return "";
          }
        );
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Failed to load employees."
          );
        }
      }
    }

    loadEmployeesByDepartment();

    return () => {
      cancelled = true;
    };
  }, [department]);

  /* =========================
     SELECT EMPLOYEE FROM URL
     ========================= */

  useEffect(() => {
    if (
      !employeeFromUrl ||
      employees.length === 0
    ) {
      return;
    }

    const cleanEmployeeNo =
      employeeFromUrl.trim();

    const employeeExists =
      employees.some(
        (employee) =>
          employee.empNo.trim() ===
          cleanEmployeeNo
      );

    if (!employeeExists) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedEmployee(
      cleanEmployeeNo
    );
  }, [
    employeeFromUrl,
    employees,
  ]);

  /* =========================
     AUTO LOAD REPORT FROM URL
     ========================= */

  useEffect(() => {
    if (
      !employeeFromUrl ||
      !selectedEmployee ||
      !from ||
      !to
    ) {
      return;
    }

    const cleanEmployeeNo =
      employeeFromUrl.trim();

    if (
      selectedEmployee.trim() !==
      cleanEmployeeNo
    ) {
      return;
    }

    /*
      Avoid loading the same URL
      employee repeatedly when the
      employees array changes.
    */
    const autoLoadKey =
      `${selectedEmployee}|${from}|${to}`;

    if (
      autoLoadedEmployee.current ===
      autoLoadKey
    ) {
      return;
    }

    autoLoadedEmployee.current =
      autoLoadKey;

    let cancelled = false;

    async function loadEmployeeAttendance() {
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
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEmployeeAttendance();

    return () => {
      cancelled = true;
    };
  }, [
    employeeFromUrl,
    selectedEmployee,
    from,
    to,
  ]);

  /* =========================
     MANUAL REPORT LOAD
     ========================= */

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

      /*
        Keep the URL-driven auto-loader
        in sync with the manually loaded
        date range.
      */
      if (
        employeeFromUrl &&
        selectedEmployee ===
          employeeFromUrl.trim()
      ) {
        autoLoadedEmployee.current =
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

  /* =========================
     EMPLOYEE CHANGE
     ========================= */

  function handleEmployeeChange(
    empNo: string
  ) {
    setSelectedEmployee(empNo);

    setReport(null);

    /*
      Allow a new report to load
      if the user changes selection.
    */
    autoLoadedEmployee.current =
      null;
  }

  /* =========================
     DATE CHANGES
     ========================= */

  function handleFromChange(
    value: string
  ) {
    setFrom(value);
    setReport(null);

    autoLoadedEmployee.current =
      null;
  }

  function handleToChange(
    value: string
  ) {
    setTo(value);
    setReport(null);

    autoLoadedEmployee.current =
      null;
  }

  /* =========================
     RENDER
     ========================= */

  return (
    <main className="main-content">
      {/* =====================
          PAGE HEADER
          ===================== */}

      <header className="page-header">
        <div>
          <span className="eyebrow">
            Attendance Management
          </span>

          <h1>
            Individual Attendance
          </h1>

          <p>
            Select an employee and review
            attendance records for any
            date range.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            window.print()
          }
          disabled={!report}
        >
          Print Report
        </button>
      </header>

      {/* =====================
          FILTERS
          ===================== */}

      <section className="filter-card">
        <div className="filter-grid">
          {/* DEPARTMENT */}

          <div className="field">
            <label>
              Department
            </label>

            <select
              value={department}
              onChange={(e) => {
                setDepartment(
                  e.target.value
                );

                setReport(null);

                autoLoadedEmployee.current =
                  null;
              }}
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
          </div>

          {/* EMPLOYEE */}

          <div className="field employee-field">
            <label>
              Employee
            </label>

            <EmployeePicker
              employees={employees}
              value={
                selectedEmployee
              }
              onChange={
                handleEmployeeChange
              }
            />
          </div>

          {/* DATE FROM */}

          <div className="field">
            <label>
              Date from
            </label>

            <input
              type="date"
              value={from}
              onChange={(e) =>
                handleFromChange(
                  e.target.value
                )
              }
            />
          </div>

          {/* DATE TO */}

          <div className="field">
            <label>
              Date to
            </label>

            <input
              type="date"
              value={to}
              onChange={(e) =>
                handleToChange(
                  e.target.value
                )
              }
            />
          </div>

          {/* VIEW REPORT */}

          <div className="button-field">
            <button
              type="button"
              className="primary-button"
              onClick={
                handleViewReport
              }
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "View Report"}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </section>

      {/* =====================
          REPORT
          ===================== */}

      {report && (
        <>
          {/* PRINT HEADER */}

          <section className="print-report-header">
            <div className="print-company-row">
              <h1>
                COLOUR PLUS PRINTING SYSTEMS
              </h1>

              <h2>
                Individual Attendance
                Summary
              </h2>
            </div>

            <div className="print-date-range">
              <div>
                <strong>
                  Date From :
                </strong>

                <span>
                  {
                    report.employee
                      .dateFrom
                  }
                </span>
              </div>

              <div>
                <strong>
                  Date To :
                </strong>

                <span>
                  {
                    report.employee
                      .dateTo
                  }
                </span>
              </div>
            </div>

            <div className="print-employee-info">
              <div>
                <strong>
                  Emp Number & Name
                </strong>

                <span>
                  {
                    report.employee
                      .empNo
                  }
                  &nbsp;&nbsp;
                  {
                    report.employee
                      .name
                  }
                </span>
              </div>

              <div>
                <strong>
                  Department
                </strong>

                <span>
                  {report.employee
                    .department ||
                    "-"}
                </span>
              </div>
            </div>
          </section>

          {/* EMPLOYEE DETAILS */}

          <section className="employee-card">
            <div>
              <span>
                Employee Number
              </span>

              <strong>
                {
                  report.employee
                    .empNo
                }
              </strong>
            </div>

            <div>
              <span>
                Employee Name
              </span>

              <strong>
                {
                  report.employee
                    .name
                }
              </strong>
            </div>

            <div>
              <span>
                Department
              </span>

              <strong>
                {report.employee
                  .department ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>
                Shift
              </span>

              <strong>
                {report.employee
                  .shift ||
                  "-"}
              </strong>
            </div>
          </section>

          {/* SUMMARY */}

          <section className="summary-grid">
            <SummaryCard
              title="Total Late"
              value={
                report.totals
                  .totalLate
              }
              subtitle={`${report.totals.lateMinutes} minutes`}
            />

            <SummaryCard
              title="Total Early"
              value={
                report.totals
                  .totalEarly
              }
              subtitle={`${report.totals.earlyMinutes} minutes`}
            />

            <SummaryCard
              title="Total OT"
              value={
                report.totals
                  .totalOT
              }
              subtitle={`${report.totals.otMinutes} minutes`}
            />

            <SummaryCard
              title="Attendance Days"
              value={String(
                report.attendance
                  .length
              )}
              subtitle={`${report.employee.dateFrom} to ${report.employee.dateTo}`}
            />
          </section>

          {/* ATTENDANCE TABLE */}

          <section className="report-card">
            <div className="report-heading">
              <div>
                <h2>
                  Attendance Details
                </h2>

                <p>
                  {
                    report.employee
                      .name
                  }{" "}
                  ·{" "}
                  {
                    report.employee
                      .empNo
                  }
                </p>
              </div>

              <span>
                {
                  report.employee
                    .dateFrom
                }{" "}
                →{" "}
                {
                  report.employee
                    .dateTo
                }
              </span>
            </div>

            <AttendanceTable
              rows={
                report.attendance
              }
              totals={
                report.totals
              }
            />
          </section>
        </>
      )}
    </main>
  );
}

export default AttendancePage;