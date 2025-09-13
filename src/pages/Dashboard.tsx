import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Simplified Dashboard: Only Quick Insights (removes all image analysis hooks/UI)
export default function Dashboard() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [randSeed] = useState(() => Math.random() * 1000);

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

  // Deterministic noise helper for demo values
  const noise = (x: number, salt: number) => {
    const s = Math.sin(x * 12.9898 + salt + randSeed) * 43758.5453;
    return s - Math.floor(s);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
        />

        {/* Main */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? "ml-16" : "ml-64"
          }`}
        >
          {/* Header */}
          <div className="h-16 border-b border-border bg-card/70 backdrop-blur px-6 flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight">AgriSense Dashboard</h1>
              <span className="text-[11px] text-muted-foreground">
                Welcome, {user?.name?.split?.(" ")?.[0] || "Grower"}
              </span>
            </div>
          </div>

          {/* Quick Insights only */}
          <div className="px-4 sm:px-6 py-4 max-w-5xl mx-auto">
            <Card className="bg-card border-border/60 rounded-xl shadow-sm">
              <CardContent className="text-sm text-muted-foreground space-y-2 p-5">
                <div>
                  Estimated evapotranspiration today:{" "}
                  <span className="text-foreground font-medium">
                    {(3 + Math.round(noise(1, 5) * 10) / 10).toFixed(1)} mm
                  </span>
                </div>
                <div>
                  Suggested irrigation window:{" "}
                  <span className="text-foreground font-medium">6–8 AM</span>
                </div>
                <div>
                  Growing degree days (last 24h):{" "}
                  <span className="text-foreground font-medium">
                    {Math.round(12 + noise(2, 9) * 8)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}