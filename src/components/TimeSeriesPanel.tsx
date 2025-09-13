import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  CalendarDays,
  Droplets,
  Thermometer,
  Gauge,
  Leaf,
  Play,
  Pause,
} from "lucide-react";

interface TimeSeriesPanelProps {
  selectedField: any;
}

const sensorConfig = {
  soil_moisture: { 
    color: "#0088ff", 
    icon: Droplets, 
    label: "Soil Moisture",
    unit: "%"
  },
  air_temperature: { 
    color: "#ff0080", 
    icon: Thermometer, 
    label: "Temperature",
    unit: "°C"
  },
  humidity: { 
    color: "#00ff88", 
    icon: Gauge, 
    label: "Humidity",
    unit: "%"
  },
  leaf_wetness: { 
    color: "#ffaa00", 
    icon: Leaf, 
    label: "Leaf Wetness",
    unit: "%"
  },
};

export function TimeSeriesPanel({ selectedField }: TimeSeriesPanelProps) {
  const [timeRange, setTimeRange] = useState(7); // days
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSensors, setSelectedSensors] = useState<string[]>([
    "soil_moisture",
    "air_temperature",
  ]);

  const endTime = Date.now();
  const startTime = endTime - (timeRange * 24 * 60 * 60 * 1000);

  const sensorData = useQuery(
    api.sensors.getFieldSensorData,
    selectedField
      ? {
          fieldId: selectedField._id,
          startTime,
          endTime,
        }
      : "skip"
  );

  // Process data for chart
  const chartData = sensorData ? processChartData(sensorData, selectedSensors) : [];

  const toggleSensor = (sensorType: string) => {
    setSelectedSensors(prev => 
      prev.includes(sensorType)
        ? prev.filter(s => s !== sensorType)
        : [...prev, sensorType]
    );
  };

  if (!selectedField) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <CalendarDays className="h-8 w-8 mx-auto mb-2" />
          <p>Select a field to view time series data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Time Series Data</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-4">
          {[1, 7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={timeRange === days ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(days)}
            >
              {days}d
            </Button>
          ))}
        </div>

        {/* Sensor Toggles */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(sensorConfig).map(([type, config]) => {
            const Icon = config.icon;
            const isSelected = selectedSensors.includes(type);
            
            return (
              <motion.div
                key={type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start gap-2 h-auto py-2"
                  onClick={() => toggleSensor(type)}
                >
                  <Icon className="h-3 w-3" style={{ color: config.color }} />
                  <span className="text-xs">{config.label}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {selectedSensors.map((sensorType) => (
                <Line
                  key={sensorType}
                  type="monotone"
                  dataKey={sensorType}
                  stroke={sensorConfig[sensorType as keyof typeof sensorConfig]?.color}
                  strokeWidth={2}
                  dot={false}
                  name={sensorConfig[sensorType as keyof typeof sensorConfig]?.label}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <CalendarDays className="h-8 w-8 mx-auto mb-2" />
              <p>No sensor data available</p>
              <p className="text-sm">Data will appear here once sensors start reporting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function processChartData(sensorData: any[], selectedSensors: string[]) {
  // Group data by timestamp (rounded to nearest hour)
  const groupedData = new Map();

  sensorData.forEach((reading) => {
    if (!selectedSensors.includes(reading.sensorType)) return;

    const hourTimestamp = Math.floor(reading.timestamp / (60 * 60 * 1000)) * (60 * 60 * 1000);
    const timeKey = new Date(hourTimestamp).toLocaleString();

    if (!groupedData.has(timeKey)) {
      groupedData.set(timeKey, { time: timeKey, timestamp: hourTimestamp });
    }

    groupedData.get(timeKey)[reading.sensorType] = reading.value;
  });

  return Array.from(groupedData.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-48); // Last 48 hours of data
}