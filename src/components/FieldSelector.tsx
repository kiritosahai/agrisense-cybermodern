import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Plus } from "lucide-react";

interface FieldSelectorProps {
  fields: any[];
  selectedField: any;
  onFieldSelect: (field: any) => void;
}

export function FieldSelector({ fields, selectedField, onFieldSelect }: FieldSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedField?._id || ""}
        onValueChange={(value) => {
          const field = fields.find(f => f._id === value);
          if (field) onFieldSelect(field);
        }}
      >
        <SelectTrigger className="w-48">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <SelectValue placeholder="Select a field" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field._id} value={field._id}>
              <div className="flex flex-col">
                <span>{field.name}</span>
                <span className="text-xs text-muted-foreground">
                  {field.cropType} • {field.area} ha
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button variant="outline" size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
