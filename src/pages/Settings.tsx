import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export default function SettingsPage() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Demo data seeding
  const seedData = useMutation(api.sampleData.createSampleData);

  const handleSeed = async () => {
    try {
      const res = await seedData({});
      toast.success("Sample data added");
      if (res?.alertsCreated) {
        toast(`Created ${res.alertsCreated} alerts`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to seed sample data");
    }
  };

  // Simple preferences (client-only toggles for now)
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);

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
              <SettingsIcon className="h-5 w-5" />
              Settings
            </h1>
            <Button variant="outline" size="sm" onClick={handleSeed}>
              Seed Sample Data
            </Button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="block">Email Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive alert summaries and critical notifications via email.
                    </p>
                  </div>
                  <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="block">Push Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Show in-app alerts and critical warnings instantly.
                    </p>
                  </div>
                  <Switch checked={notifyPush} onCheckedChange={setNotifyPush} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>Name: {user?.name || "User"}</div>
                <div>Email: {user?.email || "N/A"}</div>
                <div>Farm: {user?.farmName || "Unset"}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}