export interface Department {
  code: string;
  name: string;
}

export interface Employee {
  empNo: string;
  name: string;
  departmentCode: string | null;
  department: string | null;
  shift: string | null;
  status: string | null;
  attendanceEnabled: string | null;
}

export interface AttendanceRow {
  date: string;

  shiftIn: string | null;

  timeIn: string | null;

  shiftOut: string | null;

  timeOut: string | null;

  late: string | null;

  early: string | null;

  ot: string | null;

  abs: string | null;

  status: string;

  legacyStatus: string | null;
}

export interface AttendanceReport {
  employee: {
    empNo: string;
    name: string;
    departmentCode: string | null;
    department: string | null;
    shift: string | null;
    dateFrom: string;
    dateTo: string;
  };

  attendance: AttendanceRow[];

  totals: {
    lateMinutes: number;
    earlyMinutes: number;
    otMinutes: number;
    totalLate: string;
    totalEarly: string;
    totalOT: string;
  };
}