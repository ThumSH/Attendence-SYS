import type { AttendanceRow } from "../types/attendance";

interface AttendanceTableProps {
  rows: AttendanceRow[];
  totals?: {
    totalLate: string;
    totalEarly: string;
    totalOT: string;
  };
}

function displayValue(value: string | null) {
  if (!value || value.trim() === "") {
    return "";
  }

  return value;
}

function formatDate(date: string) {
  const value = new Date(`${date}T00:00:00`);

  return value.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function AttendanceTable({
  rows,
  totals,
}: AttendanceTableProps) {
  return (
    <div className="table-wrapper">
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Shift In</th>
            <th>Time In</th>
            <th>Shift Out</th>
            <th>Time Out</th>
            <th>Late</th>
            <th>Early</th>
            <th>OT</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="empty-row">
                No attendance records found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.date}>
                <td>{formatDate(row.date)}</td>

                <td>{displayValue(row.shiftIn)}</td>

                <td>
                  <span
                    className={
                      row.timeIn === "AB"
                        ? "status-absent"
                        : row.timeIn === "Sunday"
                        ? "status-sunday"
                        : ""
                    }
                  >
                    {displayValue(row.timeIn)}
                  </span>
                </td>

                <td>{displayValue(row.shiftOut)}</td>

                <td>{displayValue(row.timeOut)}</td>

                <td
                  className={
                    row.late && row.late !== "0"
                      ? "late-value"
                      : ""
                  }
                >
                  {displayValue(row.late)}
                </td>

                <td
                  className={
                    row.early && row.early !== "0"
                      ? "early-value"
                      : ""
                  }
                >
                  {displayValue(row.early)}
                </td>

                <td
                  className={
                    row.ot && row.ot !== "0"
                      ? "ot-value"
                      : ""
                  }
                >
                  {displayValue(row.ot)}
                </td>
              </tr>
            ))
          )}

          {totals && rows.length > 0 && (
            <tr className="total-row">
              <td colSpan={5}>Total</td>

              <td>{totals.totalLate}</td>

              <td>{totals.totalEarly}</td>

              <td>{totals.totalOT}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AttendanceTable;