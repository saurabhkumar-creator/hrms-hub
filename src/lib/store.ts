import { Employee, AttendanceRecord, AttendanceStatus } from "./types";

const EMPLOYEES_KEY = "hrms_employees";
const ATTENDANCE_KEY = "hrms_attendance";

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Employees
export function getEmployees(): Employee[] {
  return read<Employee>(EMPLOYEES_KEY);
}

export function addEmployee(emp: Omit<Employee, "createdAt">): Employee {
  const employees = getEmployees();
  if (employees.find((e) => e.id === emp.id)) {
    throw new Error(`Employee ID "${emp.id}" already exists.`);
  }
  if (employees.find((e) => e.email === emp.email)) {
    throw new Error(`Email "${emp.email}" is already in use.`);
  }
  const newEmp: Employee = { ...emp, createdAt: new Date().toISOString() };
  write(EMPLOYEES_KEY, [...employees, newEmp]);
  return newEmp;
}

export function deleteEmployee(id: string): void {
  const employees = getEmployees().filter((e) => e.id !== id);
  write(EMPLOYEES_KEY, employees);
  // Also remove attendance records
  const attendance = getAttendance().filter((a) => a.employeeId !== id);
  write(ATTENDANCE_KEY, attendance);
}

// Attendance
export function getAttendance(): AttendanceRecord[] {
  return read<AttendanceRecord>(ATTENDANCE_KEY);
}

export function getAttendanceForEmployee(employeeId: string): AttendanceRecord[] {
  return getAttendance().filter((a) => a.employeeId === employeeId);
}

export function markAttendance(
  employeeId: string,
  date: string,
  status: AttendanceStatus
): AttendanceRecord {
  const all = getAttendance();
  const existing = all.find(
    (a) => a.employeeId === employeeId && a.date === date
  );
  if (existing) {
    existing.status = status;
    write(ATTENDANCE_KEY, all);
    return existing;
  }
  const record: AttendanceRecord = {
    id: crypto.randomUUID(),
    employeeId,
    date,
    status,
  };
  write(ATTENDANCE_KEY, [...all, record]);
  return record;
}

// Dashboard stats
export function getDashboardStats() {
  const employees = getEmployees();
  const attendance = getAttendance();
  const today = new Date().toISOString().split("T")[0];
  const todayRecords = attendance.filter((a) => a.date === today);
  const presentToday = todayRecords.filter((a) => a.status === "Present").length;
  const absentToday = todayRecords.filter((a) => a.status === "Absent").length;

  const deptCounts: Record<string, number> = {};
  employees.forEach((e) => {
    deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
  });

  return {
    totalEmployees: employees.length,
    presentToday,
    absentToday,
    unmarkedToday: employees.length - todayRecords.length,
    departmentBreakdown: deptCounts,
  };
}
