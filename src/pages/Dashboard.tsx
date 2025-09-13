import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { MapCanvas } from "@/components/MapCanvas";
import { TimeSeriesPanel } from "@/components/TimeSeriesPanel";
import { AlertsPanel } from "@/components/AlertsPanel";
import { FieldSelector } from "@/components/FieldSelector";
import { Loader2 } from "lucide-react";
import PlantImageUploader from "@/components/PlantImageUploader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Dashboard() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const fields = useQuery(api.fields.getUserFields);

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

  const selectedField = fields?.find(f => f._id === selectedFieldId) || fields?.[0];

  const allUserUnackedAlerts = useQuery(api.alerts.getUserAlerts, { acknowledged: false }) || [];
  const unackedCount = allUserUnackedAlerts.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
        />

        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          {/* Header */}
          <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold tracking-tight">AgriSense Dashboard</h1>
              {fields && fields.length > 0 && (
                <FieldSelector
                  fields={fields}
                  selectedField={selectedField}
                  onFieldSelect={(field) => setSelectedFieldId(field._id)}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Alerts bell with unread count */}
              <Button
                variant="outline"
                size="sm"
                className="relative"
                onClick={() => {
                  navigate("/alerts");
                  if (unackedCount === 0) toast("No new alerts");
                }}
              >
                <Bell className="h-4 w-4" />
                {unackedCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1 py-0 text-[10px] leading-5 rounded-full"
                  >
                    {unackedCount > 99 ? "99+" : unackedCount}
                  </Badge>
                )}
              </Button>

              <PlantImageUploader selectedField={selectedField ?? null} onUploaded={() => {}} />
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="flex-1 flex">
            {/* Map Canvas */}
            <motion.div 
              className="flex-1 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <MapCanvas selectedField={selectedField} />
            </motion.div>

            {/* Right Panel */}
            <motion.div 
              className="w-96 border-l border-border bg-card flex flex-col"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Time Series Panel */}
              <div className="flex-1 border-b border-border">
                <TimeSeriesPanel selectedField={selectedField} />
              </div>

              {/* Alerts Panel */}
              <div className="h-80">
                <AlertsPanel selectedField={selectedField} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}