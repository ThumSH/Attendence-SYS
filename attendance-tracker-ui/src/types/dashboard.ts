export interface DashboardSummary {
  totalEmployees: number;
  attendanceRecords: number;
  present: number;
  absent: number;
  late: number;
  missingCheckIn: number;
  missingCheckOut: number;
}

export interface DashboardDepartment {
  code: string | null;
  name: string | null;
  total: number;
  present: number;
  absent: number;
  missingCheckIn: number;
  missingCheckOut: number;
}

export interface DashboardAttendanceRow {
  empNo: string | null;
  name: string | null;
  departmentCode: string | null;
  department: string | null;
  shiftIn: string | null;
  timeIn: string | null;
  shiftOut: string | null;
  timeOut: string | null;
  late: string | null;
  early: string | null;
  ot: string | null;
  status: string;
}

export interface DashboardData {
  date: string;

  summary: DashboardSummary;

  departments: DashboardDepartment[];

  attendance: DashboardAttendanceRow[];
}