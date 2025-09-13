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
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sun, CloudSun, Thermometer, Droplets } from "lucide-react";

export default function Dashboard() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const fields = useQuery(api.fields.getUserFields);

  // Always run this hook before any early returns to keep hook order stable
  const allUserUnackedAlerts =
    useQuery(api.alerts.getUserAlerts, { acknowledged: false }) || [];
  const unackedCount = allUserUnackedAlerts.length

  // MOVE THESE HOOKS ABOVE EARLY RETURNS TO KEEP HOOK ORDER STABLE
  const selectedField =
    fields?.find((f) => f._id === selectedFieldId) || fields?.[0];

  const latestReadings =
    useQuery(
      api.sensors.getLatestSensorReadings,
      selectedField ? { fieldId: selectedField._id } : "skip"
    ) || [];

  const getReading = (type: string) =>
    (latestReadings.find((r: any) => r.sensorType === type)?.value as
      | number
      | undefined);

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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background text-foreground">
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
          <div className="h-16 sticky top-0 z-40 border-b border-border bg-card/70 backdrop-blur px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight">AgriSense Dashboard</h1>
                <span className="text-[11px] text-muted-foreground hidden sm:block">
                  Welcome, {user?.name?.split?.(" ")?.[0] || "Grower"}
                </span>
              </div>
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

          {/* Metrics Row */}
          {selectedField && (
            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/70 border-border/60 backdrop-blur rounded-xl shadow-sm hover:shadow-md transition">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Thermometer className="h-4 w-4 text-red-400" />
                      <span className="text-sm">Temperature</span>
                    </div>
                    <span className="text-xs text-green-500">Optimal</span>
                  </div>
                  <div className="text-2xl font-semibold">
                    {Math.round((getReading("air_temperature") ?? 24) * 10) / 10}°C
                  </div>
                  <Progress
                    className="h-2 mt-3"
                    value={Math.min(
                      100,
                      Math.max(0, ((getReading("air_temperature") ?? 24) / 40) * 100)
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-border/60 backdrop-blur rounded-xl shadow-sm hover:shadow-md transition">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Droplets className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">Humidity</span>
                    </div>
                    <span className="text-xs text-green-500">Optimal</span>
                  </div>
                  <div className="text-2xl font-semibold">
                    {Math.round(getReading("humidity") ?? 58)}%
                  </div>
                  <Progress
                    className="h-2 mt-3"
                    value={Math.min(100, Math.max(0, getReading("humidity") ?? 58))}
                  />
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-border/60 backdrop-blur rounded-xl shadow-sm hover:shadow-md transition">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sun className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm">Leaf Wetness</span>
                    </div>
                    <span className="text-xs text-amber-500">Watch</span>
                  </div>
                  <div className="text-2xl font-semibold">
                    {Math.round(getReading("leaf_wetness") ?? 35)}%
                  </div>
                  <Progress
                    className="h-2 mt-3"
                    value={Math.min(100, Math.max(0, getReading("leaf_wetness") ?? 35))}
                  />
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-border/60 backdrop-blur rounded-xl shadow-sm hover:shadow-md transition">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Droplets className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm">Soil Moisture</span>
                    </div>
                    <span className="text-xs text-amber-500">
                      {( (getReading("soil_moisture") ?? 32) < 35) ? "Needs water soon" : "Good"}
                    </span>
                  </div>
                  <div className="text-2xl font-semibold">
                    {Math.round(getReading("soil_moisture") ?? 32)}%
                  </div>
                  <Progress
                    className="h-2 mt-3"
                    value={Math.min(100, Math.max(0, getReading("soil_moisture") ?? 32))}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Forecast + Tasks */}
          {selectedField && (
            <div className="px-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card/60 border-border">
                <CardContent className="p-5">
                  <div className="mb-3">
                    <div className="text-lg font-semibold">Today's Forecast</div>
                    <div className="text-xs text-muted-foreground">
                      May affect your outdoor plants
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-3 text-sm">
                    {[
                      { t: "Now", temp: 23, icon: Sun },
                      { t: "10 AM", temp: 24, icon: Sun },
                      { t: "12 PM", temp: 26, icon: Sun },
                      { t: "2 PM", temp: 27, icon: Sun },
                      { t: "4 PM", temp: 25, icon: CloudSun },
                      { t: "6 PM", temp: 22, icon: CloudSun },
                    ].map((f, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <f.icon className="h-4 w-4 text-yellow-500" />
                        <div className="text-muted-foreground">{f.t}</div>
                        <div className="font-medium">{f.temp}°C</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 border-border">
                <CardContent className="p-5">
                  <div className="mb-3">
                    <div className="text-lg font-semibold">Plant Care Tasks</div>
                    <div className="text-xs text-muted-foreground">From active alerts</div>
                  </div>
                  <div className="divide-y divide-border">
                    {(allUserUnackedAlerts || []).slice(0, 4).map((a: any) => (
                      <div key={a._id} className="py-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{a.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {a.description}
                          </div>
                        </div>
                        <span className="text-xs text-green-500">Due: Today</span>
                      </div>
                    ))}
                    {((allUserUnackedAlerts || []).length === 0) && (
                      <div className="py-3 text-sm text-muted-foreground">
                        No tasks right now. You're all set!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dashboard Content */}
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Map Canvas */}
            <motion.div 
              className="flex-1 relative min-h-[260px] lg:min-h-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <MapCanvas selectedField={selectedField} />
            </motion.div>

            {/* Right Panel */}
            <motion.div 
              className="w-full lg:w-96 lg:border-l border-t lg:border-t-0 border-border bg-card flex flex-col"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Time Series Panel */}
              <div className="lg:flex-1 border-b border-border">
                <TimeSeriesPanel selectedField={selectedField} />
              </div>

              {/* Alerts Panel */}
              <div className="h-auto lg:h-80">
                <AlertsPanel selectedField={selectedField} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}