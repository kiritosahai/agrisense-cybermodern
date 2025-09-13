import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, BarChart3 } from "lucide-react";
import { FieldSelector } from "@/components/FieldSelector";
import { TimeSeriesPanel } from "@/components/TimeSeriesPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, Sun, Wind } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const chartTheme = {
  grid: "hsl(var(--border))",
  axis: "hsl(var(--muted-foreground))",
  legend: {
    color: "hsl(var(--muted-foreground))",
    fontSize: 12,
  },
  tooltip: {
    bg: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--foreground))",
    muted: "hsl(var(--muted-foreground))",
    shadow: "0 8px 24px hsl(var(--background)/0.35)",
  },
};

export default function AnalyticsPage() {
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

  // Fake 24h analysis data (deterministic per hour)
  const hours: Array<number> = Array.from({ length: 24 }, (_, i) => i);
  const noise = (x: number, salt: number) => {
    const s = Math.sin(x * 12.9898 + salt) * 43758.5453;
    return s - Math.floor(s);
  };
  const fake24hData = hours.map((h) => {
    const t = 68 + 8 * Math.sin((Math.PI * (h - 6)) / 12) + noise(h, 7) * 2; // °F
    const hum = 55 + 20 * Math.sin((Math.PI * (h + 2)) / 12) + noise(h, 11) * 5; // %
    const wind = 6 + 6 * Math.abs(Math.sin((Math.PI * (h + 3)) / 12)) + noise(h, 19) * 2; // mph
    // Introduce occasional missing data points to visualize gaps
    const isHumidityMissing = [3, 8, 14].includes(h);
    const isWindMissing = [5, 12, 20].includes(h);
    return {
      hour: `${h}:00`,
      temperature: Math.round(t),
      humidity: isHumidityMissing ? null : Math.max(0, Math.min(100, Math.round(hum))),
      wind: isWindMissing ? null : Math.round(wind * 10) / 10,
    };
  });

  // Fake 7-day trend data (daily aggregates)
  const days: Array<string> = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const fake7dData = days.map((d, i) => {
    const base = i + 1;
    const t = 70 + 5 * Math.sin((Math.PI * base) / 3.5) + noise(base, 23) * 2; // °F
    const hum = 60 + 12 * Math.sin((Math.PI * base) / 3.2) + noise(base, 29) * 4; // %
    const wind = 7 + 4 * Math.abs(Math.sin((Math.PI * base) / 3.7)) + noise(base, 31) * 1.5; // mph
    return {
      day: d,
      temperatureAvg: Math.round(t),
      // Simulate an occasional missing day for humidityAvg
      humidityAvg: [1, 5].includes(i) ? null : Math.max(0, Math.min(100, Math.round(hum))),
      windAvg: i === 3 ? null : Math.round(wind * 10) / 10,
    };
  });

  const latest = fake24hData[fake24hData.length - 1];
  const metricCards = [
    {
      label: "Temperature",
      value: `${latest.temperature}°F`,
      status: "Optimal",
      icon: Thermometer,
      color: "text-emerald-500",
    },
    {
      label: "Humidity",
      value: latest.humidity != null ? `${latest.humidity}%` : "—",
      status:
        latest.humidity != null && latest.humidity >= 45 && latest.humidity <= 75
          ? "Good"
          : "Watch",
      icon: Droplets,
      color: "text-sky-500",
    },
    {
      label: "Light",
      value: `850 lux`,
      status: "Unknown",
      icon: Sun,
      color: "text-amber-500",
    },
    {
      label: "Airflow",
      value: latest.wind != null ? `${latest.wind} mph` : "—",
      status:
        latest.wind != null && latest.wind >= 5 && latest.wind <= 15 ? "Good" : "Low",
      icon: Wind,
      color: "text-cyan-500",
    },
  ] as const;

  // Custom tooltip that handles nulls gracefully
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
                <BarChart3 className="h-5 w-5" />
                Analytics
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

          {/* Fake Analysis Summary */}
          <div className="px-4 sm:px-6 py-3 md:py-4 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {metricCards.map((m, i) => {
              const Icon = m.icon;
              return (
                <Card key={i} className="bg-card border-border/60 rounded-xl shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">{m.label}</div>
                      <Icon className={`h-4 w-4 ${m.color}`} />
                    </div>
                    <div className="mt-1 text-2xl font-semibold">{m.value}</div>
                    <div className={`mt-1 text-xs ${m.status === "Optimal" || m.status === "Good" ? "text-emerald-500" : "text-amber-500"}`}>
                      {m.status}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Insights (random info) */}
          <div className="px-4 sm:px-6 pb-4 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <Card className="bg-card border-border/60 rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Insights</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>Estimated evapotranspiration today: <span className="text-foreground font-medium">{(3 + Math.round(noise(1, 5) * 10) / 10).toFixed(1)} mm</span></div>
                <div>Suggested irrigation window: <span className="text-foreground font-medium">6–8 AM</span></div>
                <div>Growing degree days (last 24h): <span className="text-foreground font-medium">{Math.round(12 + noise(2, 9) * 8)}</span></div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/60 rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>Soil moisture variation across zones appears <span className="text-foreground font-medium">moderate</span>.</div>
                <div>Wind gusts may reach <span className="text-foreground font-medium">{Math.round(10 + noise(3, 13) * 10)} mph</span> in the afternoon.</div>
                <div>Leaf wetness risk overnight: <span className="text-amber-500 font-medium">elevated</span>.</div>
              </CardContent>
            </Card>
          </div>

          {/* 24-Hour History */}
          <div className="px-4 sm:px-6 pb-4 max-w-7xl mx-auto">
            <Card className="bg-card border-border/60 rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">24-Hour History</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] md:h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fake24hData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="hour" stroke={chartTheme.axis} fontSize={12} tickLine={false} />
                    <YAxis stroke={chartTheme.axis} fontSize={12} tickLine={false} />
                    <Tooltip content={<MissingAwareTooltip />} />
                    <Legend wrapperStyle={{ color: chartTheme.legend.color, fontSize: chartTheme.legend.fontSize }} />
                    <Line type="monotone" dataKey="temperature" name="Temperature (°F)" stroke="#6b8afd" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
                    <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#34d399" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
                    <Line type="monotone" dataKey="wind" name="Wind (mph)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 7-Day Trend */}
          <div className="px-4 sm:px-6 pb-6 max-w-7xl mx-auto">
            <Card className="bg-card border-border/60 rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">7-Day Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] md:h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fake7dData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="day" stroke={chartTheme.axis} fontSize={12} tickLine={false} />
                    <YAxis stroke={chartTheme.axis} fontSize={12} tickLine={false} />
                    <Tooltip content={<MissingAwareTooltip />} />
                    <Legend wrapperStyle={{ color: chartTheme.legend.color, fontSize: chartTheme.legend.fontSize }} />
                    <Line type="monotone" dataKey="temperatureAvg" name="Avg Temperature (°F)" stroke="#6b8afd" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
                    <Line type="monotone" dataKey="humidityAvg" name="Avg Humidity (%)" stroke="#34d399" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
                    <Line type="monotone" dataKey="windAvg" name="Avg Wind (mph)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            <TimeSeriesPanel selectedField={selectedField} />
          </div>
        </div>
      </div>
    </div>
  );
}