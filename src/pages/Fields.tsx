import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldSelector } from "@/components/FieldSelector";

export default function FieldsPage() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fields = useQuery(api.fields.getUserFields);

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
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
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Fields
            </h1>
            {fields && fields.length > 0 && (
              <FieldSelector
                fields={fields}
                selectedField={selectedField}
                onFieldSelect={(field) => setSelectedFieldId(field._id)}
              />
            )}
          </div>

          {selectedField && (
            <div className="px-6 pt-4">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">
                    Selected: {selectedField.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  <div>Crop: {selectedField.cropType}</div>
                  <div>Area: {selectedField.area} ha</div>
                  <div>
                    Center: {selectedField.centerLat.toFixed(4)}, {selectedField.centerLng.toFixed(4)}
                  </div>
                  {selectedField.soilType && <div>Soil: {selectedField.soilType}</div>}
                  {selectedField.plantingDate && (
                    <div>
                      Planted: {new Date(selectedField.plantingDate).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields && fields.length > 0 ? (
              fields.map((field) => (
                <Card key={field._id} className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base">{field.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <div>Crop: {field.cropType}</div>
                    <div>Area: {field.area} ha</div>
                    <div>
                      Center: {field.centerLat.toFixed(4)},{" "}
                      {field.centerLng.toFixed(4)}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-sm text-muted-foreground">
                No fields yet. Add data to see your fields listed here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}