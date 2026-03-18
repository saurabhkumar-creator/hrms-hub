import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmployees, addEmployee, deleteEmployee } from "@/lib/store";
import { Employee } from "@/lib/types";

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });
}

export function useAddEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emp: Omit<Employee, "createdAt">) => {
      const result = addEmployee(emp);
      return Promise.resolve(result);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      deleteEmployee(id);
      return Promise.resolve();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
