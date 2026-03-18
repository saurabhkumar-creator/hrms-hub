import { useState } from "react";
import { useEmployees, useAddEmployee, useDeleteEmployee } from "@/hooks/use-employees";
import { DEPARTMENTS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, X, Search, Users, Mail, Building, Hash, Loader2 } from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const employeeSchema = z.object({
  id: z.string().trim().min(1, "Employee ID is required").max(50),
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  department: z.string().min(1, "Department is required"),
});

export default function EmployeesPage() {
  const { data: employees = [], isLoading } = useEmployees();
  const addMutation = useAddEmployee();
  const deleteMutation = useDeleteEmployee();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: "", fullName: "", email: "", department: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.id.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = employeeSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        fieldErrors[i.path[0] as string] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    addMutation.mutate(
      { id: result.data.id, fullName: result.data.fullName, email: result.data.email, department: result.data.department },
      {
        onSuccess: () => {
          toast.success("Employee added successfully");
          setForm({ id: "", fullName: "", email: "", department: "" });
          setShowForm(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`${deleteTarget.name} has been removed`);
        setDeleteTarget(null);
      },
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{employees.length} total employee{employees.length !== 1 ? "s" : ""} in your organization</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Employee"}
        </Button>
      </div>

      {/* Add Form Slide-over */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="surface-card overflow-hidden"
          >
            <div className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">New Employee</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    <Hash className="h-3 w-3 inline mr-1 opacity-50" />
                    Employee ID
                  </label>
                  <Input
                    placeholder="e.g. EMP-001"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    className={errors.id ? "border-destructive" : ""}
                  />
                  {errors.id && <p className="form-error">{errors.id}</p>}
                </div>
                <div>
                  <label className="form-label">
                    <Users className="h-3 w-3 inline mr-1 opacity-50" />
                    Full Name
                  </label>
                  <Input
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && <p className="form-error">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="form-label">
                    <Mail className="h-3 w-3 inline mr-1 opacity-50" />
                    Email Address
                  </label>
                  <Input
                    placeholder="john@company.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="form-error">{errors.email}</p>}
                </div>
                <div>
                  <label className="form-label">
                    <Building className="h-3 w-3 inline mr-1 opacity-50" />
                    Department
                  </label>
                  <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                    <SelectTrigger className={errors.department ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && <p className="form-error">{errors.department}</p>}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={addMutation.isPending} className="gap-2">
                  {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {addMutation.isPending ? "Adding..." : "Save Employee"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Search */}
      {employees.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees by name, ID, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="surface-card p-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : employees.length === 0 ? (
        <div className="surface-card">
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <p className="empty-state-title">No employees yet</p>
            <p className="empty-state-description">Click "Add Employee" above to add your first team member</p>
          </div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="surface-card">
          <div className="empty-state">
            <Search className="empty-state-icon" />
            <p className="empty-state-title">No results found</p>
            <p className="empty-state-description">Try adjusting your search terms</p>
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
                  <th className="hidden sm:table-cell">Email</th>
                  <th className="hidden md:table-cell">Department</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="font-mono text-xs tabular-nums text-muted-foreground">{emp.id}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground shrink-0">
                          {emp.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{emp.fullName}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted-foreground hidden sm:table-cell text-sm">{emp.email}</td>
                    <td className="hidden md:table-cell">
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {emp.department}
                      </span>
                    </td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget({ id: emp.id, name: emp.fullName })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{deleteTarget?.name}</span>?
              This will permanently remove them and all their attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
