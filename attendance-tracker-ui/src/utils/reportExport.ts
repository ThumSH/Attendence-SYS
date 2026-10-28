import * as XLSX from "xlsx";

export interface ExportColumn<T> {
  key: keyof T;
  label: string;
}

interface ExportOptions<T> {
  rows: T[];
  columns: ExportColumn<T>[];
  fileName: string;
  sheetName?: string;
}

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function downloadBlob(
  blob: Blob,
  fileName: string
) {
  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

export function exportToCsv<T>({
  rows,
  columns,
  fileName,
}: ExportOptions<T>) {
  const header = columns
    .map((column) =>
      escapeCsvValue(column.label)
    )
    .join(",");

  const body = rows
    .map((row) =>
      columns
        .map((column) =>
          escapeCsvValue(
            row[column.key]
          )
        )
        .join(",")
    )
    .join("\n");

  const csv =
    `${header}\n${body}`;

  const blob = new Blob(
    [csv],
    {
      type:
        "text/csv;charset=utf-8;",
    }
  );

  downloadBlob(
    blob,
    ensureExtension(
      fileName,
      ".csv"
    )
  );
}

export function exportToExcel<T>({
  rows,
  columns,
  fileName,
  sheetName = "Report",
}: ExportOptions<T>) {
  const data = rows.map(
    (row) => {
      const result: Record<
        string,
        unknown
      > = {};

      columns.forEach(
        (column) => {
          result[column.label] =
            row[column.key];
        }
      );

      return result;
    }
  );

  const worksheet =
    XLSX.utils.json_to_sheet(
      data
    );

  worksheet["!cols"] =
    columns.map(
      (column) => ({
        wch: Math.max(
          column.label.length + 2,
          12
        ),
      })
    );

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sanitizeSheetName(
      sheetName
    )
  );

  XLSX.writeFile(
    workbook,
    ensureExtension(
      fileName,
      ".xlsx"
    )
  );
}

export function buildReportFileName(
  reportTitle: string,
  dateFrom: string,
  dateTo: string
) {
  const safeTitle =
    reportTitle
      .trim()
      .replace(
        /[^a-zA-Z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );

  return [
    safeTitle ||
      "Attendance_Report",
    dateFrom,
    "to",
    dateTo,
  ].join("_");
}

function ensureExtension(
  fileName: string,
  extension: string
) {
  if (
    fileName
      .toLowerCase()
      .endsWith(
        extension.toLowerCase()
      )
  ) {
    return fileName;
  }

  return `${fileName}${extension}`;
}

function sanitizeSheetName(
  value: string
) {
  const cleaned =
    value
      .replace(
        /[\\/?*[\]:]/g,
        " "
      )
      .trim();

  return (
    cleaned.slice(0, 31) ||
    "Report"
  );
}