import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Upload } from "lucide-react";

type PlantImageUploaderProps = {
  selectedField: any | null;
  onUploaded?: () => void;
};

export default function PlantImageUploader({ selectedField, onUploaded }: PlantImageUploaderProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{ greenRatio: number; dryRatio: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const addImageWithAnalysis = useMutation(api.images.addImageWithAnalysis);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setAnalysis(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const runAnalysis = async () => {
    if (!file || !previewUrl) return;
    setAnalyzing(true);
    try {
      // Load image into a canvas and compute a simple "green coverage" metric
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = previewUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
      });

      const canvas = canvasRef.current || document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");

      // scale down for faster processing
      const maxSide = 512;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.floor(img.width * scale));
      const h = Math.max(1, Math.floor(img.height * scale));
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const { data } = ctx.getImageData(0, 0, w, h);
      let greenish = 0;
      let dryish = 0;
      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 20) continue; // skip transparent
        total++;
        if (g > r && g > b && g > 60) greenish++;
        if (r > g && r > b && r > 80) dryish++;
      }
      const greenRatio = total > 0 ? greenish / total : 0;
      const dryRatio = total > 0 ? dryish / total : 0;
      setAnalysis({ greenRatio, dryRatio });
      toast.success("Analysis complete");
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze image");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedField) {
      toast.error("Select a field first");
      return;
    }
    if (!file || !analysis) {
      toast.error("Upload and analyze an image first");
      return;
    }
    try {
      await addImageWithAnalysis({
        fieldId: selectedField._id,
        filename: file.name,
        fileSize: file.size,
        indices: {
          ndviApprox: Number((analysis.greenRatio).toFixed(3)),
          dryness: Number((analysis.dryRatio).toFixed(3)),
        },
      });
      toast.success("Saved analysis");
      setOpen(false);
      setFile(null);
      setAnalysis(null);
      onUploaded?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save analysis");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Plant Image
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Plant Image Analysis</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          {previewUrl && (
            <div className="rounded-lg border border-border p-2">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-64 w-full object-contain rounded"
              />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!file || analyzing}
              onClick={runAnalysis}
            >
              {analyzing ? "Analyzing..." : "Analyze"}
            </Button>
            {analysis && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">
                  Green coverage ~ {(analysis.greenRatio * 100).toFixed(1)}%
                </Badge>
                <Badge variant="secondary">
                  Dry coverage ~ {(analysis.dryRatio * 100).toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={!analysis || !file || !selectedField}>
            Save Analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
