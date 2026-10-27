import type {
  AttendanceReport,
  Department,
  Employee,
} from "../types/attendance";
import type { DashboardData } from "../types/dashboard";
import type {
  ReportResponse,
  ReportType,
} from "../types/reports";

const API_BASE_URL = "http://localhost:5266";

export async function getDepartments(): Promise<Department[]> {
  const response = await fetch(`${API_BASE_URL}/api/departments`);

  if (!response.ok) {
    throw new Error("Failed to load departments.");
  }

  return response.json();
}

export async function getDashboard(
  date?: string
): Promise<DashboardData> {
  const params = new URLSearchParams();

  if (date) {
    params.set("date", date);
  }

  const query = params.toString();

  const response = await fetch(
    `${API_BASE_URL}/api/dashboard${query ? `?${query}` : ""}`
  );

  if (!response.ok) {
    throw new Error("Failed to load dashboard.");
  }

  return response.json();
}

export async function getEmployees(
  search?: string,
  department?: string
): Promise<Employee[]> {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  if (department?.trim()) {
    params.set("department", department.trim());
  }

  const query = params.toString();

  const response = await fetch(
    `${API_BASE_URL}/api/employees${query ? `?${query}` : ""}`
  );

  if (!response.ok) {
    throw new Error("Failed to load employees.");
  }

  return response.json();
}
export async function getReport(
  type: ReportType,
  from: string,
  to: string,
  department?: string,
  empNo?: string
): Promise<ReportResponse> {
  const params = new URLSearchParams();

  params.set("type", type);
  params.set("from", from);
  params.set("to", to);

  if (department) {
    params.set("department", department);
  }

  if (empNo) {
    params.set("empNo", empNo);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/reports?${params.toString()}`
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ||
        "Failed to load report."
    );
  }

  return response.json();
}

export async function getAttendance(
  empNo: string,
  from: string,
  to: string
): Promise<AttendanceReport> {
  const params = new URLSearchParams({
    from,
    to,
  });

  

  const response = await fetch(
    `${API_BASE_URL}/api/attendance/${encodeURIComponent(empNo)}?${params}`
  );

  if (!response.ok) {
    throw new Error("Failed to load attendance report.");
  }

  return response.json();

  
}