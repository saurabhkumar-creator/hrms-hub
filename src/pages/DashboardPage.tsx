import { getDashboardStats } from "@/lib/store";
import { getEmployees, getAttendance } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, UserX, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStats,
  });
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });
  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance"],
    queryFn: getAttendance,
  });

  if (!stats) return null;

  const cards = [
    {
      label: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      iconBg: "bg-accent",
      iconColor: "text-primary",
      change: null,
    },
    {
      label: "Present Today",
      value: stats.presentToday,
      icon: UserCheck,
      iconBg: "bg-[hsl(var(--status-present-bg))]",
      iconColor: "text-status-present",
      change: stats.totalEmployees > 0
        ? `${Math.round((stats.presentToday / stats.totalEmployees) * 100)}%`
        : null,
    },
    {
      label: "Absent Today",
      value: stats.absentToday,
      icon: UserX,
      iconBg: "bg-[hsl(var(--status-absent-bg))]",
      iconColor: "text-status-absent",
      change: null,
    },
    {
      label: "Unmarked",
      value: stats.unmarkedToday,
      icon: Clock,
      iconBg: "bg-[hsl(var(--status-warning-bg))]",
      iconColor: "text-status-warning",
      change: null,
    },
  ];

  // Recent employees (last 5)
  const recentEmployees = [...employees]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Attendance rate for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const weeklyData = last7Days.map((date) => {
    const dayRecords = attendance.filter((a) => a.date === date);
    const present = dayRecords.filter((a) => a.status === "Present").length;
    return { date, present, total: dayRecords.length };
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Page Header */}
      <motion.div variants={item} className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your workforce and today's attendance</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, idx) => (
          <motion.div
            key={c.label}
            variants={item}
            className="stat-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{c.value}</p>
                {c.change && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-status-present">
                    <TrendingUp className="h-3 w-3" />
                    <span>{c.change} rate</span>
                  </div>
                )}
              </div>
              <div className={`h-10 w-10 rounded-xl ${c.iconBg} flex items-center justify-center`}>
                <c.icon className={`h-5 w-5 ${c.iconColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Overview */}
        <motion.div variants={item} className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Weekly Attendance</h2>
            <Link to="/attendance">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          {employees.length > 0 ? (
            <div className="flex items-end gap-2 h-32">
              {weeklyData.map((d) => {
                const rate = employees.length > 0 ? (d.present / employees.length) : 0;
                const label = new Date(d.date + "T12:00:00").toLocaleDateString("en", { weekday: "short" });
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full bg-muted rounded-md relative" style={{ height: '80px' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-md bg-primary/80 transition-all duration-500"
                        style={{ height: `${Math.max(rate * 100, 2)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state py-8">
              <p className="empty-state-description">Add employees and mark attendance to see weekly trends</p>
            </div>
          )}
        </motion.div>

        {/* Department Breakdown */}
        <motion.div variants={item} className="surface-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Departments</h2>
          {Object.keys(stats.departmentBreakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.departmentBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([dept, count]) => {
                  const pct = Math.round((count / stats.totalEmployees) * 100);
                  return (
                    <div key={dept}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-foreground font-medium">{dept}</span>
                        <span className="tabular-nums text-muted-foreground text-xs">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="empty-state py-8">
              <p className="empty-state-description">No departments yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Employees */}
      <motion.div variants={item} className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Recent Employees</h2>
          <Link to="/employees">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        {recentEmployees.length > 0 ? (
          <div className="space-y-2">
            {recentEmployees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground shrink-0">
                  {emp.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{emp.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.department} · {emp.email}</p>
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground font-mono shrink-0">{emp.id}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state py-6">
            <Users className="empty-state-icon" />
            <p className="empty-state-title">No employees yet</p>
            <p className="empty-state-description">Add your first employee to get started</p>
            <Link to="/employees" className="mt-3">
              <Button size="sm">Add Employee</Button>
            </Link>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
