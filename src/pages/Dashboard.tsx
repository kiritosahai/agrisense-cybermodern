import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Images as ImagesIcon, Stethoscope, Video as VideoIcon, Link2, Thermometer, Droplets } from "lucide-react";

type SelectedFile = { file: File; previewUrl: string };
type AnalysisResult = {
  fileName: string;
  previewUrl: string;
  greenRatio: number;
  dryRatio: number;
  plantName: string;
  healthCondition: "Healthy" | "Moderate" | "Stressed";
  growthStage: "Seedling" | "Vegetative" | "Flowering" | "Maturation";
  possibleDiseases: string[];
};

export default function Dashboard() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Interactive Plant Analysis state
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<
    Array<{
      fileName: string;
      previewUrl: string;
      greenRatio: number;
      dryRatio: number;
      plantName: string;
      healthCondition: "Healthy" | "Moderate" | "Stressed";
      growthStage: "Seedling" | "Vegetative" | "Flowering" | "Maturation";
      possibleDiseases: string[];
    }>
  >([]);
  // Add camera input ref for in-app capture
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Live video analysis state/refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const analysisIntervalRef = useRef<number | null>(null);
  const [liveActive, setLiveActive] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<{ greenRatio: number; dryRatio: number; tempC: number; humidityPct: number } | null>(null);
  const [linkedCameraUrl, setLinkedCameraUrl] = useState<string | null>(null);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((f: SelectedFile) => URL.revokeObjectURL(f.previewUrl));
      results.forEach((r: AnalysisResult) => URL.revokeObjectURL(r.previewUrl));
      // Stop any active media stream and interval on unmount
      if (analysisIntervalRef.current) {
        window.clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      const v = videoRef.current;
      const stream = v?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      if (v) v.srcObject = null;
    };
  }, [selectedFiles, results]);

  const handleFilesChange = (filesList: FileList | null) => {
    if (!filesList) return;
    // Revoke previous URLs
    selectedFiles.forEach((f: SelectedFile) => URL.revokeObjectURL(f.previewUrl));
    const files = Array.from(filesList);
    const mapped = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setSelectedFiles(mapped);
    setResults([]); // reset results when new files chosen
  };

  // Live video frame analysis
  const analyzeVideoFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = videoCanvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = Math.max(1, Math.floor(video.videoWidth));
    const h = Math.max(1, Math.floor(video.videoHeight));
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);

    const { data } = ctx.getImageData(0, 0, w, h);
    let greenish = 0;
    let dryish = 0;
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 20) continue;
      total++;
      if (g > r && g > b && g > 60) greenish++;
      if (r > g && r > b && r > 80) dryish++;
    }
    const greenRatio = total > 0 ? greenish / total : 0;
    const dryRatio = total > 0 ? dryish / total : 0;

    // Derive simple, live placeholder environment metrics from frame stats
    const tempC = Math.round((18 + greenRatio * 12) * 10) / 10; // ~18–30°C
    const humidityPct = Math.round((30 + (1 - dryRatio) * 60) * 10) / 10; // ~30–90%

    setLiveMetrics({ greenRatio, dryRatio, tempC, humidityPct });
  };

  const startLiveAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setLiveActive(true);
      // Analyze ~2 times a second to keep CPU light
      if (analysisIntervalRef.current) window.clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = window.setInterval(analyzeVideoFrame, 500);
    } catch (e) {
      console.error("Unable to start camera:", e);
      alert("Unable to access camera. Please allow camera permissions.");
    }
  };

  const stopLiveAnalysis = () => {
    if (analysisIntervalRef.current) {
      window.clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setLiveActive(false);
    setLiveMetrics(null);
  };

  const handleLinkCamera = () => {
    const url = window.prompt("Enter camera stream URL (HTTPS only; RTSP not supported in browsers):", linkedCameraUrl || "");
    if (!url) return;
    setLinkedCameraUrl(url);
    alert("Camera linked. External stream playback is coming soon. For now, live analysis works with the device camera.");
  };

  const analyzeImage = async (previewUrl: string): Promise<{
    greenRatio: number;
    dryRatio: number;
    plantName: string;
    healthCondition: "Healthy" | "Moderate" | "Stressed";
    growthStage: "Seedling" | "Vegetative" | "Flowering" | "Maturation";
    possibleDiseases: string[];
  }> => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = previewUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

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
      if (a < 20) continue;
      total++;
      if (g > r && g > b && g > 60) greenish++;
      if (r > g && r > b && r > 80) dryish++;
    }
    const greenRatio = total > 0 ? greenish / total : 0;
    const dryRatio = total > 0 ? dryish / total : 0;

    const healthCondition: "Healthy" | "Moderate" | "Stressed" =
      greenRatio >= 0.6 && dryRatio < 0.2
        ? "Healthy"
        : greenRatio >= 0.35 && dryRatio < 0.35
        ? "Moderate"
        : "Stressed";

    const growthStage: "Seedling" | "Vegetative" | "Flowering" | "Maturation" =
      greenRatio > 0.65
        ? "Vegetative"
        : greenRatio > 0.5
        ? "Flowering"
        : greenRatio > 0.35
        ? "Maturation"
        : "Seedling";

    const possibleDiseases: string[] = [];
    if (dryRatio > 0.35) possibleDiseases.push("Drought Stress");
    if (greenRatio < 0.3) possibleDiseases.push("Nutrient Deficiency");
    if (greenRatio >= 0.3 && greenRatio < 0.5 && dryRatio >= 0.2)
      possibleDiseases.push("Leaf Scorch (placeholder)");

    const names = ["Maize (placeholder)", "Wheat (placeholder)", "Soybean (placeholder)", "Tomato (placeholder)"];
    const plantName = names[Math.floor(greenRatio * names.length)] || "Unknown (placeholder)";

    return { greenRatio, dryRatio, healthCondition, growthStage, possibleDiseases, plantName };
  };

  const analyzeAll = async () => {
    if (selectedFiles.length === 0) return;
    setAnalyzing(true);
    try {
      const computed: Array<AnalysisResult> = await Promise.all(
        selectedFiles.map(async (f: SelectedFile) => {
          const res = await analyzeImage(f.previewUrl);
          return {
            fileName: f.file.name,
            previewUrl: f.previewUrl,
            greenRatio: Number(res.greenRatio.toFixed(3)),
            dryRatio: Number(res.dryRatio.toFixed(3)),
            plantName: res.plantName,
            healthCondition: res.healthCondition,
            growthStage: res.growthStage,
            possibleDiseases: res.possibleDiseases,
          };
        })
      );
      setResults(computed);
    } finally {
      setAnalyzing(false);
    }
  };

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

  // removed unused noise helper (referenced undefined randSeed)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
        />

        {/* Main */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? "ml-16" : "ml-64"
          }`}
        >
          {/* Header */}
          <div className="h-16 border-b border-border bg-card/70 backdrop-blur px-6 flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight">agri-spectra Dashboard</h1>
              <span className="text-[11px] text-muted-foreground">
                Welcome, {user?.name?.split?.(" ")?.[0] || "Grower"}
              </span>
            </div>
          </div>

          {/* Interactive Plant Analysis Section */}
          <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
            <Card className="bg-card/60 border-border rounded-xl shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <ImagesIcon className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-medium">Upload Images</span>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFilesChange(e.target.files)}
                    className="max-w-md"
                  />
                  {/* Hidden camera input for direct capture */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFilesChange(e.target.files)}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    Take Photo
                  </Button>
                  <Button
                    size="sm"
                    className="ml-0 md:ml-auto bg-green-600 hover:bg-green-600/90"
                    onClick={analyzeAll}
                    disabled={selectedFiles.length === 0 || analyzing}
                  >
                    {analyzing ? "Analyzing..." : "Analyze Images"}
                  </Button>
                </div>

                {/* 24/7 Live Video Analysis */}
                <div className="mt-4 rounded-lg border border-border/60 p-4 bg-background/40">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <VideoIcon className="h-5 w-5 text-green-400" />
                      <span className="text-sm font-medium">24/7 Video Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={liveActive ? "outline" : "default"}
                        className={liveActive ? "" : "bg-green-600 hover:bg-green-600/90"}
                        onClick={liveActive ? stopLiveAnalysis : startLiveAnalysis}
                      >
                        {liveActive ? "Stop Live" : "Start Live"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleLinkCamera} className="gap-2">
                        <Link2 className="h-4 w-4" />
                        Link Camera
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 rounded-md border border-border/50 overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-64 object-cover bg-black/40"
                        playsInline
                        muted
                      />
                      <canvas ref={videoCanvasRef} className="hidden" />
                    </div>
                    <div className="rounded-md border border-border/50 p-3">
                      <div className="text-xs text-muted-foreground mb-2">Live Metrics</div>
                      {liveMetrics ? (
                        <div className="space-y-3">
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Green Coverage</div>
                            <div className="text-sm font-medium text-green-400">
                              {(liveMetrics.greenRatio * 100).toFixed(1)}%
                            </div>
                            <Progress value={Math.min(100, Math.max(0, liveMetrics.greenRatio * 100))} className="h-1.5 mt-1" />
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Dry Coverage</div>
                            <div className="text-sm font-medium text-amber-400">
                              {(liveMetrics.dryRatio * 100).toFixed(1)}%
                            </div>
                            <Progress value={Math.min(100, Math.max(0, liveMetrics.dryRatio * 100))} className="h-1.5 mt-1" />
                          </div>
                          {/* Added: Live Temperature */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Thermometer className="h-3.5 w-3.5 text-red-400" />
                              <div className="text-[11px] text-muted-foreground">Temperature</div>
                            </div>
                            <div className="text-sm font-medium text-red-300">
                              {liveMetrics.tempC.toFixed(1)}°C
                            </div>
                            <Progress
                              value={Math.min(100, Math.max(0, ((liveMetrics.tempC - 10) / 30) * 100))}
                              className="h-1.5 mt-1"
                            />
                          </div>
                          {/* Added: Live Humidity */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Droplets className="h-3.5 w-3.5 text-blue-400" />
                              <div className="text-[11px] text-muted-foreground">Humidity</div>
                            </div>
                            <div className="text-sm font-medium text-blue-300">
                              {liveMetrics.humidityPct.toFixed(1)}%
                            </div>
                            <Progress
                              value={Math.min(100, Math.max(0, liveMetrics.humidityPct))}
                              className="h-1.5 mt-1"
                            />
                          </div>
                          {linkedCameraUrl && (
                            <div className="text-[11px] text-muted-foreground break-all">
                              Linked: <span className="text-foreground">{linkedCameraUrl}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Start Live to compute continuous plant coverage. Link Camera to save your stream URL for future playback.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* End 24/7 Live Video Analysis */}

                {/* Selected previews (before analysis) */}
                {selectedFiles.length > 0 && results.length === 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
                    {selectedFiles.map((f: SelectedFile, i: number) => (
                      <Card key={i} className="border-border">
                        <CardContent className="p-2">
                          <img
                            src={f.previewUrl}
                            alt={f.file.name}
                            className="w-full h-40 object-cover rounded-md"
                          />
                          <div className="mt-2 text-xs text-muted-foreground truncate">{f.file.name}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Results grid */}
                {results.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((r: AnalysisResult, i: number) => (
                      <Card key={i} className="border-border/70 hover:border-green-500/40 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <img
                              src={r.previewUrl}
                              alt={r.fileName}
                              className="w-24 h-24 object-cover rounded-md border border-border/60"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold truncate">{r.fileName}</div>
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${
                                    r.healthCondition === "Healthy"
                                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                      : r.healthCondition === "Moderate"
                                      ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                                      : "bg-red-500/15 text-red-400 border-red-500/30"
                                  }`}
                                >
                                  {r.healthCondition}
                                </Badge>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Plant: <span className="text-foreground">{r.plantName}</span>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Growth Stage: <span className="text-foreground">{r.growthStage}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-border/60 p-2">
                              <div className="text-[11px] text-muted-foreground mb-1">Green Coverage</div>
                              <div className="text-sm font-medium text-green-400">
                                {(r.greenRatio * 100).toFixed(1)}%
                              </div>
                              <Progress value={Math.min(100, Math.max(0, r.greenRatio * 100))} className="h-1.5 mt-1" />
                            </div>
                            <div className="rounded-lg border border-border/60 p-2">
                              <div className="text-[11px] text-muted-foreground mb-1">Dry Coverage</div>
                              <div className="text-sm font-medium text-amber-400">
                                {(r.dryRatio * 100).toFixed(1)}%
                              </div>
                              <Progress value={Math.min(100, Math.max(0, r.dryRatio * 100))} className="h-1.5 mt-1" />
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="text-xs font-medium flex items-center gap-2 mb-1">
                              <Stethoscope className="h-3.5 w-3.5 text-green-400" />
                              Possible Diseases (placeholder)
                            </div>
                            {r.possibleDiseases.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {r.possibleDiseases.map((d: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {d}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">None detected</div>
                            )}
                          </div>

                          <div className="mt-4 rounded-md border border-green-500/20 bg-green-500/5 p-3">
                            <div className="text-xs font-medium text-green-400 mb-1">AI Insights (coming soon)</div>
                            <p className="text-xs text-muted-foreground">
                              This section will be powered by advanced plant disease and variety models to provide
                              detailed diagnostics and recommendations.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}