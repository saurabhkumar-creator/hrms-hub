import { useState, useMemo } from "react";
import { useEmployees } from "@/hooks/use-employees";
import { useAttendance, useMarkAttendance } from "@/hooks/use-attendance";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AttendanceStatus } from "@/lib/types";
import { CalendarCheck, Check, X as XIcon, Users, Loader2, CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function AttendancePage() {
  const { data: employees = [] } = useEmployees();
  const { data: allAttendance = [] } = useAttendance();
  const markMutation = useMarkAttendance();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [filterEmployee, setFilterEmployee] = useState("all");

  const dateStr = selectedDate.toISOString().split("T")[0];

  const attendanceForDate = useMemo(() => {
    return allAttendance.filter((a) => a.date === dateStr);
  }, [allAttendance, dateStr]);

  const getStatus = (empId: string): AttendanceStatus | null => {
    const record = attendanceForDate.find((a) => a.employeeId === empId);
    return record?.status || null;
  };

  const handleMark = (employeeId: string, status: AttendanceStatus) => {
    markMutation.mutate(
      { employeeId, date: dateStr, status },
      {
        onSuccess: () => toast.success(`Marked as ${status}`),
      }
    );
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const unmarked = filteredEmployees.filter((e) => !getStatus(e.id));
    if (unmarked.length === 0) {
      toast.info("All employees already marked for this date");
      return;
    }
    unmarked.forEach((emp) => {
      markMutation.mutate({ employeeId: emp.id, date: dateStr, status });
    });
    toast.success(`Marked ${unmarked.length} employees as ${status}`);
  };

  const filteredEmployees = filterEmployee === "all"
    ? employees
    : employees.filter((e) => e.id === filterEmployee);

  const presentDays = (empId: string) =>
    allAttendance.filter((a) => a.employeeId === empId && a.status === "Present").length;

  const totalPresent = attendanceForDate.filter((a) => a.status === "Present").length;
  const totalAbsent = attendanceForDate.filter((a) => a.status === "Absent").length;
  const totalUnmarked = employees.length - attendanceForDate.length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Track and manage daily attendance for your team</p>
      </div>

      {/* Summary cards for selected date */}
      {employees.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="surface-card p-3 text-center">
            <p className="text-lg font-semibold tabular-nums text-status-present">{totalPresent}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-0.5">Present</p>
          </div>
          <div className="surface-card p-3 text-center">
            <p className="text-lg font-semibold tabular-nums text-status-absent">{totalAbsent}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-0.5">Absent</p>
          </div>
          <div className="surface-card p-3 text-center">
            <p className="text-lg font-semibold tabular-nums text-status-warning">{totalUnmarked}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-0.5">Unmarked</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="form-label">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="form-label">Employee</label>
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {employees.length > 0 && filterEmployee === "all" && (
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleMarkAll("Present")}>
              <Check className="h-3 w-3" /> Mark All Present
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleMarkAll("Absent")}>
              <XIcon className="h-3 w-3" /> Mark All Absent
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      {employees.length === 0 ? (
        <div className="surface-card">
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <p className="empty-state-title">No employees found</p>
            <p className="empty-state-description">Add employees first to start tracking attendance</p>
          </div>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th className="hidden sm:table-cell">Total Present</th>
                  <th>Status</th>
                  <th>Mark</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const status = getStatus(emp.id);
                  const totalPresent = presentDays(emp.id);
                  return (
                    <tr key={emp.id}>
                      <td className="font-mono text-xs tabular-nums text-muted-foreground">{emp.id}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground shrink-0">
                            {emp.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{emp.fullName}</p>
                            <p className="text-xs text-muted-foreground">{emp.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="tabular-nums text-sm font-medium">{totalPresent}</span>
                        <span className="text-xs text-muted-foreground ml-1">days</span>
                      </td>
                      <td>
                        {status ? (
                          <span className={status === "Present" ? "badge-present" : "badge-absent"}>
                            <span className={`h-1.5 w-1.5 rounded-full ${status === "Present" ? "bg-status-present" : "bg-status-absent"}`} />
                            {status}
                          </span>
                        ) : (
                          <span className="badge-warning">
                            <span className="h-1.5 w-1.5 rounded-full bg-status-warning" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant={status === "Present" ? "default" : "outline"}
                            className="h-8 w-8 p-0"
                            onClick={() => handleMark(emp.id, "Present")}
                            disabled={markMutation.isPending}
                            title="Mark Present"
                          >
                            {markMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant={status === "Absent" ? "destructive" : "outline"}
                            className="h-8 w-8 p-0"
                            onClick={() => handleMark(emp.id, "Absent")}
                            disabled={markMutation.isPending}
                            title="Mark Absent"
                          >
                            <XIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t bg-muted/30 text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarCheck className="h-3 w-3" />
            {format(selectedDate, "EEEE, MMMM d, yyyy")} · {filteredEmployees.length} employees
          </div>
        </div>
      )}
    </motion.div>
  );
}
