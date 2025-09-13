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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sun, CloudSun, Thermometer, Droplets, MapPin } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts";

export default function Dashboard() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [randSeed] = useState(() => Math.random() * 1000);

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

  const requestLocation = () => {
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by your browser.");
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        toast.success("Location detected");
      },
      (err) => {
        console.error(err);
        setLocationError(err.message || "Failed to get location");
        toast.error("Failed to get location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // ===== Analytics-style demo data & theme (mirrors Analytics page) =====
  const chartTheme = {
    grid: "hsl(var(--border))",
    axis: "hsl(var(--muted-foreground))",
    legend: { color: "hsl(var(--muted-foreground))", fontSize: 12 },
    tooltip: {
      bg: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      color: "hsl(var(--foreground))",
      muted: "hsl(var(--muted-foreground))",
      shadow: "0 8px 24px hsl(var(--background)/0.35)",
    },
  };

  const hours: Array<number> = Array.from({ length: 24 }, (_, i) => i);
  const noise = (x: number, salt: number) => {
    const s = Math.sin(x * 12.9898 + salt + randSeed) * 43758.5453;
    return s - Math.floor(s);
  };
  const fake24hData = hours.map((h) => {
    const t = 68 + 8 * Math.sin((Math.PI * (h - 6)) / 12) + noise(h, 7) * 2;
    const hum = 55 + 20 * Math.sin((Math.PI * (h + 2)) / 12) + noise(h, 11) * 5;
    const wind = 6 + 6 * Math.abs(Math.sin((Math.PI * (h + 3)) / 12)) + noise(h, 19) * 2;
    const isHumidityMissing = [3, 8, 14].includes(h);
    const isWindMissing = [5, 12, 20].includes(h);
    return {
      hour: `${h}:00`,
      temperature: Math.round(t),
      humidity: isHumidityMissing ? null : Math.max(0, Math.min(100, Math.round(hum))),
      wind: isWindMissing ? null : Math.round(wind * 10) / 10,
    };
  });

  const days: Array<string> = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const fake7dData = days.map((d, i) => {
    const base = i + 1;
    const t = 70 + 5 * Math.sin((Math.PI * base) / 3.5) + noise(base, 23) * 2;
    const hum = 60 + 12 * Math.sin((Math.PI * base) / 3.2) + noise(base, 29) * 4;
    const wind = 7 + 4 * Math.abs(Math.sin((Math.PI * base) / 3.7)) + noise(base, 31) * 1.5;
    return {
      day: d,
      temperatureAvg: Math.round(t),
      humidityAvg: [1, 5].includes(i) ? null : Math.max(0, Math.min(100, Math.round(hum))),
      windAvg: i === 3 ? null : Math.round(wind * 10) / 10,
    };
  });

  const xyData = Array.from({ length: 30 }, (_, i) => ({
    x: i,
    y: Math.round(50 + 30 * Math.sin(i / 5) + noise(i, 37) * 10),
  }));

  const latest = fake24hData[fake24hData.length - 1];
  const metricCards = [
    { label: "Temperature", value: `${latest.temperature}°F`, status: "Optimal", color: "text-emerald-500" },
    {
      label: "Humidity",
      value: latest.humidity != null ? `${latest.humidity}%` : "—",
      status: latest.humidity != null && latest.humidity >= 45 && latest.humidity <= 75 ? "Good" : "Watch",
      color: "text-sky-500",
    },
    { label: "Light", value: `850 lux`, status: "Unknown", color: "text-amber-500" },
    {
      label: "Airflow",
      value: latest.wind != null ? `${latest.wind} mph` : "—",
      status: latest.wind != null && latest.wind >= 5 && latest.wind <= 15 ? "Good" : "Low",
      color: "text-cyan-500",
    },
  ] as const;

  const MissingAwareTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    const items = payload.filter((p: any) => p && p.dataKey);
    return (
      <div
        style={{
          backgroundColor: chartTheme.tooltip.bg,
          border: chartTheme.tooltip.border,
          borderRadius: 8,
          padding: "8px 10px",
          fontSize: 12,
          boxShadow: chartTheme.tooltip.shadow,
        }}
      >
        <div style={{ marginBottom: 4, color: chartTheme.tooltip.muted }}>{label}</div>
        {items.map((p: any, idx: number) => {
          const val = p?.value;
          const name = p?.name || p?.dataKey;
          const color = p?.color;
          return (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, background: color, borderRadius: 9999 }} />
              <span style={{ color: chartTheme.tooltip.color }}>{name}:</span>
              <span style={{ color: val == null ? chartTheme.tooltip.muted : chartTheme.tooltip.color }}>
                {val == null ? "No data" : val}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

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
          <div className="h-14 md:h-16 sticky top-0 z-40 border-b border-border bg-card/70 backdrop-blur px-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex flex-col">
                <h1 className="text-lg md:text-xl font-bold tracking-tight">AgriSense Dashboard</h1>
                <span className="text-[11px] text-muted-foreground hidden sm:block">
                  Welcome, {user?.name?.split?.(" ")?.[0] || "Grower"}
                </span>
              </div>
              {/* Field selector removed from view */}
              <div className="hidden">{/* intentionally hidden */}</div>
            </div>
            <div className="flex items-center gap-2">
              {/* Alerts bell with unread count */}
              <Button
                variant="outline"
                size="sm"
                className="relative hover:shadow-sm"
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

              {/* New: Request user location */}
              <Button
                variant="outline"
                size="sm"
                onClick={requestLocation}
                className="gap-2"
                title="Use my location"
              >
                <MapPin className="h-4 w-4" />
                Location
              </Button>

              <PlantImageUploader selectedField={selectedField ?? null} onUploaded={() => {}} />
            </div>
          </div>

          {/* New: Location info bar */}
          {userLocation && (
            <div className="px-4 sm:px-6 py-2">
              <Card className="bg-card/70 border-border/60 backdrop-blur rounded-lg">
                <CardContent className="py-2.5 px-3 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <div className="text-muted-foreground">
                      Your location detected:
                      <span className="ml-2 text-foreground font-medium">
                        {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block text-muted-foreground">
                    Weather shown is tailored to your current area
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {locationError && (
            <div className="px-4 sm:px-6 pt-2">
              <div className="text-xs text-red-500">{locationError}</div>
            </div>
          )}

          {/* Metrics Row */}
          {selectedField && (
            <div className="px-4 sm:px-6 py-3 md:py-4 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {metricCards.map((m, i) => (
                <Card key={i} className="bg-card border-border/60 rounded-xl shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">{m.label}</div>
                      <span className={`h-4 w-4 ${m.color}` as any} />
                    </div>
                    <div className="mt-1 text-2xl font-semibold">{m.value}</div>
                    <div className={`mt-1 text-xs ${m.status === "Optimal" || m.status === "Good" ? "text-emerald-500" : "text-amber-500"}`}>
                      {m.status}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="px-4 sm:px-6 pb-4 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <Card className="bg-card border-border/60 rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <div className="text-lg font-semibold">Quick Insights</div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>Estimated evapotranspiration today: <span className="text-foreground font-medium">{(3 + Math.round(noise(1, 5) * 10) / 10).toFixed(1)} mm</span></div>
                <div>Suggested irrigation window: <span className="text-foreground font-medium">6–8 AM</span></div>
                <div>Growing degree days (last 24h): <span className="text-foreground font-medium">{Math.round(12 + noise(2, 9) * 8)}</span></div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/60 rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <div className="text-lg font-semibold">Notes</div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>Soil moisture variation across zones appears <span className="text-foreground font-medium">moderate</span>.</div>
                <div>Wind gusts may reach <span className="text-foreground font-medium">{Math.round(10 + noise(3, 13) * 10)} mph</span> in the afternoon.</div>
                <div>Leaf wetness risk overnight: <span className="text-amber-500 font-medium">elevated</span>.</div>
              </CardContent>
            </Card>
          </div>

          <div className="px-4 sm:px-6 pb-4 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { title: "Demo Alerts", value: Math.max(0, Math.round(2 + noise(4, 17) * 5)), desc: "Active notifications requiring attention" },
              { title: "Demo Jobs", value: Math.max(0, Math.round(1 + noise(5, 21) * 3)), desc: "Background processing tasks" },
              { title: "Demo Reports", value: Math.max(0, Math.round(3 + noise(6, 25) * 4)), desc: "Generated summaries available" },
              { title: "Demo Fields", value: Math.max(1, Math.round(1 + noise(7, 27) * 3)), desc: "Managed plots in your account" },
            ].map(({ title, value, desc }, i) => (
              <Card key={i} className="bg-card border-border/60 rounded-xl shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">{title}</div>
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="px-4 sm:px-6 pb-4 max-w-7xl mx-auto">
            <Card className="bg-card border-border/60 rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <div className="text-lg font-semibold">24-Hour History</div>
              </CardHeader>
              <CardContent className="h-[300px] md:h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fake24hData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="hour" stroke={chartTheme.axis} fontSize={12} tickLine={false} />
                    <YAxis stroke={chartTheme.axis} fontSize={12} tickLine={false} />
                    <RechartsTooltip content={<MissingAwareTooltip />} />
                    <Legend wrapperStyle={{ color: chartTheme.legend.color, fontSize: chartTheme.legend.fontSize }} />
                    <Line type="monotone" dataKey="temperature" name="Temperature (°F)" stroke="#6b8afd" strokeWidth={2} dot={{ r: 2 }} isAnimationActive animationDuration={700} animationEasing="ease-in-out" activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#34d399" strokeWidth={2} dot={{ r: 2 }} isAnimationActive animationDuration={700} animationEasing="ease-in-out" activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="wind" name="Wind (mph)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} isAnimationActive animationDuration={700} animationEasing="ease-in-out" activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="px-4 sm:px-6 pb-6 max-w-7xl mx-auto">
            <Card className="bg-card border-border/60 rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <div className="text-lg font-semibold">7-Day Trend</div>
              </CardHeader>
              <CardContent className="h-[300px] md:h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fake7dData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="day" stroke={chartTheme.axis} fontSize={12} tickLine={false} />
                    <YAxis stroke={chartTheme.axis} fontSize={12} tickLine={false} />
                    <RechartsTooltip content={<MissingAwareTooltip />} />
                    <Legend wrapperStyle={{ color: chartTheme.legend.color, fontSize: chartTheme.legend.fontSize }} />
                    <Line type="monotone" dataKey="temperatureAvg" name="Avg Temperature (°F)" stroke="#6b8afd" strokeWidth={2} dot={{ r: 2 }} isAnimationActive animationDuration={700} animationEasing="ease-in-out" activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="humidityAvg" name="Avg Humidity (%)" stroke="#34d399" strokeWidth={2} dot={{ r: 2 }} isAnimationActive animationDuration={700} animationEasing="ease-in-out" activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="windAvg" name="Avg Wind (mph)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} isAnimationActive animationDuration={700} animationEasing="ease-in-out" activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="px-4 sm:px-6 pb-6 max-w-7xl mx-auto">
            <Card className="bg-card border-border/60 rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <div className="text-lg font-semibold">X–Y Demo Scatter</div>
              </CardHeader>
              <CardContent className="h-[280px] md:h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis type="number" dataKey="x" stroke={chartTheme.axis} fontSize={12} tickLine={false} label={{ value: "X Value", position: "insideBottom", offset: -5, fill: chartTheme.axis }} />
                    <YAxis type="number" dataKey="y" stroke={chartTheme.axis} fontSize={12} tickLine={false} label={{ value: "Y Value", angle: -90, position: "insideLeft", fill: chartTheme.axis }} />
                    <RechartsTooltip content={<MissingAwareTooltip />} />
                    <Legend wrapperStyle={{ color: chartTheme.legend.color, fontSize: chartTheme.legend.fontSize }} />
                    <Scatter name="Demo Points" data={xyData} fill="#a78bfa" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Content */}
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Map Canvas */}
            <motion.div 
              className="flex-1 relative min-h-[300px] sm:min-h-[260px] lg:min-h-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <MapCanvas selectedField={selectedField} />
            </motion.div>

            {/* Right Panel */}
            <motion.div 
              className="w-full lg:w-96 lg:border-l border-t lg:border-t-0 border-border bg-card/95 backdrop-blur flex flex-col"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Time Series Panel */}
              <div className="lg:flex-1 border-b border-border/60">
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