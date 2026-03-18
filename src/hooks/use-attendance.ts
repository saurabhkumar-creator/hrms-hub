import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAttendance, getAttendanceForEmployee, markAttendance } from "@/lib/store";
import { AttendanceStatus } from "@/lib/types";

export function useAttendance() {
  return useQuery({
    queryKey: ["attendance"],
    queryFn: getAttendance,
  });
}

export function useEmployeeAttendance(employeeId: string) {
  return useQuery({
    queryKey: ["attendance", employeeId],
    queryFn: () => getAttendanceForEmployee(employeeId),
    enabled: !!employeeId,
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { employeeId: string; date: string; status: AttendanceStatus }) => {
      const result = markAttendance(args.employeeId, args.date, args.status);
      return Promise.resolve(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
