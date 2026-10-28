import {
  apiRequest,
} from "./apiClient";

import type {
  AttendanceAnnotation,
  AttendanceReport,
  Department,
  Employee,
  SaveAttendanceAnnotationRequest,
} from "../types/attendance";

import type {
  DashboardData,
} from "../types/dashboard";

import type {
  ReportResponse,
  ReportType,
} from "../types/reports";

/* ==========================================
   DEPARTMENTS
   ========================================== */

export async function getDepartments():
Promise<Department[]> {
  return apiRequest<Department[]>(
    "/api/departments"
  );
}

/* ==========================================
   DASHBOARD
   ========================================== */

export async function getDashboard(
  date?: string
): Promise<DashboardData> {
  const params =
    new URLSearchParams();

  if (date) {
    params.set(
      "date",
      date
    );
  }

  const query =
    params.toString();

  return apiRequest<DashboardData>(
    `/api/dashboard${
      query
        ? `?${query}`
        : ""
    }`
  );
}

/* ==========================================
   EMPLOYEES
   ========================================== */

export async function getEmployees(
  search?: string,
  department?: string
): Promise<Employee[]> {
  const params =
    new URLSearchParams();

  if (search?.trim()) {
    params.set(
      "search",
      search.trim()
    );
  }

  if (department?.trim()) {
    params.set(
      "department",
      department.trim()
    );
  }

  const query =
    params.toString();

  return apiRequest<Employee[]>(
    `/api/employees${
      query
        ? `?${query}`
        : ""
    }`
  );
}

/* ==========================================
   ATTENDANCE
   ========================================== */

export async function getAttendance(

  empNo: string,
  from: string,
  to: string
): Promise<AttendanceReport> {
  const params =
    new URLSearchParams({
      from,
      to,
    });

  return apiRequest<AttendanceReport>(
    `/api/attendance/${encodeURIComponent(
      empNo
    )}?${params.toString()}`
  );
}

export async function getAttendanceAnnotations(
  empNo: string,
  dateFrom: string,
  dateTo: string
): Promise<AttendanceAnnotation[]> {
  const params =
    new URLSearchParams({
      empNo,
      dateFrom,
      dateTo,
    });

  return apiRequest<AttendanceAnnotation[]>(
    `/api/attendance-annotations?${params.toString()}`
  );
}

export async function saveAttendanceAnnotation(
  request: SaveAttendanceAnnotationRequest
): Promise<AttendanceAnnotation> {
  return apiRequest<AttendanceAnnotation>(
    "/api/attendance-annotations",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(request),
    }
  );
}

export async function deleteAttendanceAnnotation(
  id: number
): Promise<void> {
  await apiRequest<void>(
    `/api/attendance-annotations/${id}`,
    {
      method: "DELETE",
    }
  );
}

/* ==========================================
   REPORTS
   ========================================== */

export async function getReport(
  type: ReportType,
  from: string,
  to: string,
  department?: string,
  empNo?: string
): Promise<ReportResponse> {
  const params =
    new URLSearchParams();

  params.set(
    "type",
    type
  );

  params.set(
    "from",
    from
  );

  params.set(
    "to",
    to
  );

  if (department?.trim()) {
    params.set(
      "department",
      department.trim()
    );
  }

  if (empNo?.trim()) {
    params.set(
      "empNo",
      empNo.trim()
    );
  }

  return apiRequest<ReportResponse>(
    `/api/reports?${params.toString()}`
  );
}