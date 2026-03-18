export interface Employee {
  id: string;
  fullName: string;
  email: string;
  department: string;
  createdAt: string;
}

export type AttendanceStatus = "Present" | "Absent";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
] as const;
