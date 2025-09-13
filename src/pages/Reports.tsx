import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, FileText } from "lucide-react";

export default function ReportsPage() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
        />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? "ml-16" : "ml-64"
          }`}
        >
          <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reports
            </h1>
          </div>

          <div className="p-6 text-sm text-muted-foreground">
            Generated reports will appear here.
          </div>
        </div>
      </div>
    </div>
  );
}
