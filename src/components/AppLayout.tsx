import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/employees": "Employees",
  "/attendance": "Attendance",
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentTitle = pageTitles[location.pathname] || "Page";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4 shrink-0" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <SidebarTrigger />
            <div className="h-5 w-px bg-border" />
            <nav className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">HRMS</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium text-foreground">{currentTitle}</span>
            </nav>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
