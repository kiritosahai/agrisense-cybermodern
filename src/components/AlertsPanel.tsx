import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import {
  AlertTriangle,
  Bug,
  Droplets,
  Thermometer,
  Wheat,
  Cloud,
  Check,
  Clock,
} from "lucide-react";

interface AlertsPanelProps {
  selectedField: any;
}

const alertIcons = {
  pest_risk: Bug,
  disease_detected: AlertTriangle,
  irrigation_needed: Droplets,
  harvest_ready: Wheat,
  weather_warning: Cloud,
};

const severityColors = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function AlertsPanel({ selectedField }: AlertsPanelProps) {
  const alerts = useQuery(
    (selectedField ? api.alerts.getFieldAlerts : undefined) as unknown as any,
    (selectedField ? { fieldId: selectedField._id } : undefined) as any
  );

  const acknowledgeAlert = useMutation(api.alerts.acknowledgeAlert);

  const handleAcknowledge = async (alertId: Id<"alerts">) => {
    try {
      await acknowledgeAlert({ alertId });
      toast.success("Alert acknowledged");
    } catch (error) {
      toast.error("Failed to acknowledge alert");
    }
  };

  const unacknowledgedAlerts = alerts?.filter((alert: any) => !alert.acknowledgedAt) || [];
  const acknowledgedAlerts = alerts?.filter((alert: any) => alert.acknowledgedAt) || [];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
          </h3>
          <Badge variant="secondary" className="text-xs">
            {unacknowledgedAlerts.length} active
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Unacknowledged Alerts */}
          {unacknowledgedAlerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Active Alerts</h4>
              {unacknowledgedAlerts.map((alert: any, index: number) => (
                <AlertCard
                  key={alert._id}
                  alert={alert}
                  index={index}
                  onAcknowledge={() => handleAcknowledge(alert._id)}
                />
              ))}
            </div>
          )}

          {/* Acknowledged Alerts */}
          {acknowledgedAlerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Recent</h4>
              {acknowledgedAlerts.slice(0, 5).map((alert: any, index: number) => (
                <AlertCard
                  key={alert._id}
                  alert={alert}
                  index={index + unacknowledgedAlerts.length}
                  acknowledged
                />
              ))}
            </div>
          )}

          {alerts?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No alerts for this field</p>
              <p className="text-sm">Alerts will appear here when detected</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface AlertCardProps {
  alert: any;
  index: number;
  acknowledged?: boolean;
  onAcknowledge?: () => void;
}

function AlertCard({ alert, index, acknowledged, onAcknowledge }: AlertCardProps) {
  const Icon = alertIcons[alert.type as keyof typeof alertIcons] || AlertTriangle;
  const severityClass = severityColors[alert.severity as keyof typeof severityColors];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className={`border ${acknowledged ? 'opacity-60' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${severityClass}`}>
              <Icon className="h-3 w-3" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium truncate">{alert.title}</h4>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${severityClass}`}
                >
                  {alert.severity}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {alert.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(alert._creationTime).toLocaleString()}
                </div>
                
                {!acknowledged && onAcknowledge && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={onAcknowledge}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Ack
                  </Button>
                )}
                
                {acknowledged && (
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <Check className="h-3 w-3" />
                    Acknowledged
                  </div>
                )}
              </div>
              
              {alert.metadata?.confidence && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Confidence: {Math.round(alert.metadata.confidence * 100)}%
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}