import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, Bell } from "lucide-react";
import { FieldSelector } from "@/components/FieldSelector";
import { AlertsPanel } from "@/components/AlertsPanel";

export default function AlertsPage() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const fields = useQuery(api.fields.getUserFields);
  const selectedField =
    fields?.find((f) => f._id === selectedFieldId) || fields?.[0];

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
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alerts
              </h1>
              {fields && fields.length > 0 && (
                <FieldSelector
                  fields={fields}
                  selectedField={selectedField}
                  onFieldSelect={(field) => setSelectedFieldId(field._id)}
                />
              )}
            </div>
          </div>

          <div className="flex-1">
            <AlertsPanel selectedField={selectedField} />
          </div>
        </div>
      </div>
    </div>
  );
}
