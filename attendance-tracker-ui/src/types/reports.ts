export type ReportType =
  | "daily"
  | "monthly"
  | "late"
  | "absent"
  | "missing"
  | "ot";

export interface ReportRow {
  empNo: string | null;
  name: string | null;
  departmentCode: string | null;
  department: string | null;

  date: string;

  shiftIn: string | null;
  timeIn: string | null;
  shiftOut: string | null;
  timeOut: string | null;

  late: string | null;
  early: string | null;
  ot: string | null;

  status: string;
}

export interface MonthlyReportRow {
  empNo: string | null;
  name: string | null;
  departmentCode: string | null;
  department: string | null;

  totalRows: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  missingCheckIn: number;
  missingCheckOut: number;
}

export interface ReportSummary {
  recordCount?: number;

  present?: number;
  absent?: number;
  late?: number;

  missingCheckIn?: number;
  missingCheckOut?: number;

  totalLateMinutes?: number;
  totalEarlyMinutes?: number;
  totalOtMinutes?: number;

  totalLate?: string;
  totalEarly?: string;
  totalOT?: string;

  employeeCount?: number;
}

export interface ReportResponse {
  type: ReportType;

  dateFrom: string;
  dateTo: string;

  filters: {
    department: string | null;
    empNo: string | null;
  };

  summary: ReportSummary;

  rows:
    | ReportRow[]
    | MonthlyReportRow[];
}