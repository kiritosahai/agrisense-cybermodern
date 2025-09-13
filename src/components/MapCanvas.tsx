import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { 
  Layers, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Bug, 
  TrendingUp,
  AlertTriangle 
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapCanvasProps {
  selectedField: any;
}

interface LayerControlsProps {
  layers: Record<string, boolean>;
  onLayerToggle: (layer: string) => void;
}

function LayerControls({ layers, onLayerToggle }: LayerControlsProps) {
  const layerConfig = [
    { key: "ndvi", label: "NDVI", icon: TrendingUp, color: "bg-green-500" },
    { key: "soil_moisture", label: "Soil Moisture", icon: Droplets, color: "bg-blue-500" },
    { key: "temperature", label: "Temperature", icon: Thermometer, color: "bg-red-500" },
    { key: "pest_risk", label: "Pest Risk", icon: Bug, color: "bg-orange-500" },
  ];

  return (
    <motion.div
      className="absolute top-4 right-4 z-[1000]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-64 bg-card/95 backdrop-blur-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Map Layers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {layerConfig.map((layer) => (
            <div key={layer.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${layer.color}`} />
                <layer.icon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor={layer.key} className="text-sm cursor-pointer">
                  {layer.label}
                </Label>
              </div>
              <Switch
                id={layer.key}
                checked={layers[layer.key]}
                onCheckedChange={() => onLayerToggle(layer.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FieldPopup({ field, sensorData, alerts }: any) {
  const latestReadings = sensorData?.slice(0, 3) || [];
  const fieldAlerts = alerts?.filter((alert: any) => !alert.acknowledgedAt).slice(0, 2) || [];

  return (
    <div className="min-w-[250px]">
      <div className="mb-3">
        <h3 className="font-semibold text-base">{field.name}</h3>
        <p className="text-sm text-muted-foreground">
          {field.cropType} • {field.area} hectares
        </p>
      </div>

      {latestReadings.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium mb-2">Latest Readings</h4>
          <div className="space-y-1">
            {latestReadings.map((reading: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="capitalize">
                  {reading.sensorType.replace('_', ' ')}:
                </span>
                <span className="font-medium">
                  {reading.value} {reading.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {fieldAlerts.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-orange-500" />
            Active Alerts
          </h4>
          <div className="space-y-1">
            {fieldAlerts.map((alert: any) => (
              <div key={alert._id} className="flex items-center gap-2">
                <Badge 
                  variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {alert.severity}
                </Badge>
                <span className="text-xs">{alert.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="text-xs">
          View Details
        </Button>
        <Button size="sm" className="text-xs">
          Generate Report
        </Button>
      </div>
    </div>
  );
}

export function MapCanvas({ selectedField }: MapCanvasProps) {
  const [layers, setLayers] = useState<Record<string, boolean>>({
    ndvi: true,
    soil_moisture: false,
    temperature: false,
    pest_risk: true,
  });

  const sensorData = useQuery(
    api.sensors.getLatestSensorReadings,
    selectedField ? { fieldId: selectedField._id } : "skip"
  );

  const alerts = useQuery(
    api.alerts.getFieldAlerts,
    selectedField ? { fieldId: selectedField._id } : "skip"
  );

  const handleLayerToggle = (layer: string) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  if (!selectedField) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Field Selected</h3>
          <p className="text-muted-foreground">
            Select a field to view its map and sensor data
          </p>
        </div>
      </div>
    );
  }

  const center: [number, number] = [selectedField.centerLat, selectedField.centerLng];
  const bounds = selectedField.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);

  return (
    <div className="h-full relative">
      <MapContainer
        center={center}
        zoom={16}
        className="h-full w-full"
        style={{ background: '#0a0a0a' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          className="map-tiles"
        />
        
        {/* Field Boundary */}
        <Polygon
          positions={bounds}
          pathOptions={{
            color: '#00ff88',
            weight: 2,
            fillColor: layers.ndvi ? '#00ff88' : 'transparent',
            fillOpacity: layers.ndvi ? 0.2 : 0,
          }}
        >
          <Popup>
            <FieldPopup 
              field={selectedField} 
              sensorData={sensorData} 
              alerts={alerts}
            />
          </Popup>
        </Polygon>

        {/* NDVI Overlay */}
        {layers.ndvi && (
          <TileLayer
            url={`/api/tiles/ndvi/${selectedField._id}/{z}/{x}/{y}.png`}
            opacity={0.6}
          />
        )}

        {/* Soil Moisture Overlay */}
        {layers.soil_moisture && (
          <TileLayer
            url={`/api/tiles/soil_moisture/${selectedField._id}/{z}/{x}/{y}.png`}
            opacity={0.6}
          />
        )}

        {/* Temperature Overlay */}
        {layers.temperature && (
          <TileLayer
            url={`/api/tiles/temperature/${selectedField._id}/{z}/{x}/{y}.png`}
            opacity={0.6}
          />
        )}

        {/* Pest Risk Overlay */}
        {layers.pest_risk && (
          <TileLayer
            url={`/api/tiles/pest_risk/${selectedField._id}/{z}/{x}/{y}.png`}
            opacity={0.6}
          />
        )}
      </MapContainer>

      <LayerControls layers={layers} onLayerToggle={handleLayerToggle} />

      <style>{`
        .map-tiles {
          filter: brightness(0.7) contrast(1.2) hue-rotate(200deg);
        }
        .leaflet-popup-content-wrapper {
          background: hsl(var(--card));
          color: hsl(var(--card-foreground));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
        }
        .leaflet-popup-tip {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
        }
      `}</style>
    </div>
  );
}