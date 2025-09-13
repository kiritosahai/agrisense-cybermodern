import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Satellite,
  BarChart3,
  Shield,
  Zap,
  MapPin,
  TrendingUp,
  Users,
  Globe,
  ArrowRight,
  CheckCircle,
  Leaf,
  Brain,
  Eye,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Thermometer, Droplets } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Stethoscope, Images as ImagesIcon } from "lucide-react";

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

const features = [
  {
    icon: Satellite,
    title: "Hyperspectral Imaging",
    description: "Advanced satellite and drone imagery analysis for precise crop health monitoring",
    color: "text-cyan-400",
  },
  {
    icon: Brain,
    title: "AI-Powered Analytics",
    description: "Machine learning algorithms detect diseases, pests, and optimize yield predictions",
    color: "text-pink-400",
  },
  {
    icon: Eye,
    title: "Real-time Monitoring",
    description: "IoT sensors provide continuous soil, weather, and crop condition updates",
    color: "text-green-400",
  },
  {
    icon: BarChart3,
    title: "Predictive Insights",
    description: "Data-driven recommendations for irrigation, fertilization, and harvest timing",
    color: "text-blue-400",
  },
];

const stats = [
  { label: "Farms Monitored", value: "10,000+", icon: MapPin },
  { label: "Yield Increase", value: "25%", icon: TrendingUp },
  { label: "Active Users", value: "50,000+", icon: Users },
  { label: "Countries", value: "45", icon: Globe },
];

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

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

  // Add backend action hook for analysis
  const computeMetrics = useAction(api.analysis.computeMetrics);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((f: SelectedFile) => URL.revokeObjectURL(f.previewUrl));
      results.forEach((r: AnalysisResult) => URL.revokeObjectURL(r.previewUrl));
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

    const res = await computeMetrics({
      rgba: data.buffer,
      width: w,
      height: h,
    });

    return {
      greenRatio: res.greenRatio,
      dryRatio: res.dryRatio,
      healthCondition: res.healthCondition,
      growthStage: res.growthStage,
      possibleDiseases: res.possibleDiseases,
      plantName: res.plantName,
    };
  };

  const analyzeAll = async () => {
    if (selectedFiles.length === 0) return;
    setAnalyzing(true);
    try {
      const computed = await Promise.all(
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
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <motion.nav
        className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="https://harmless-tapir-303.convex.cloud/api/storage/dcab8a5a-6b8f-4af4-ad86-e3468d917e90" alt="AgriSense" className="w-8 h-8" />
              <span className="text-xl font-bold tracking-tight">AgriSense</span>
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Button onClick={() => navigate("/dashboard")}>
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => navigate("/auth")}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Left: Text */}
            <div>
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                AI‑Powered Agriculture Platform
              </Badge>

              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                Precision Agriculture
                <br />
                <span className="bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent">
                  Redefined
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Harness the power of hyperspectral imaging, IoT sensors, and machine learning to
                optimize crop yields, reduce resource waste, and make data‑driven farming decisions.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
                >
                  Go to Dashboard
                </Button>
                <Button variant="outline" size="lg">
                  Watch Demo
                </Button>
              </div>
            </div>

            {/* Right: Metrics Panel */}
            <motion.div
              className="w-full"
              initial={{ opacity: 0, scale: 0.98, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="rounded-2xl p-6 border border-border bg-card/60 backdrop-blur-sm">
                {/* Top metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="bg-background/60 border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Thermometer className="h-4 w-4 text-red-400" />
                          <span className="text-sm">Temperature</span>
                        </div>
                      </div>
                      <div className="text-2xl font-semibold">24.5°C</div>
                      <div className="text-xs text-muted-foreground mt-1">Optimal range</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-background/60 border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Droplets className="h-4 w-4 text-blue-400" />
                          <span className="text-sm">Soil Moisture</span>
                        </div>
                      </div>
                      <div className="text-2xl font-semibold">68%</div>
                      <div className="text-xs text-muted-foreground mt-1">Good levels</div>
                    </CardContent>
                  </Card>
                </div>

                {/* NDVI card */}
                <Card className="mt-4 bg-background/60 border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium">NDVI Health Index</div>
                      <Badge variant="secondary" className="text-green-400 border-green-500/30 bg-green-500/10">
                        Healthy
                      </Badge>
                    </div>
                    <Progress value={78} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-2">
                      0.78 – Excellent vegetation health
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Plant Analysis Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-green-500/5 via-background to-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="h-5 w-5 text-green-400" />
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Interactive</Badge>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Plant Analysis Dashboard</h2>
            <p className="text-muted-foreground mt-2">
              Upload one or more crop images to analyze health indicators, growth stage, and possible diseases.
              Results are local and serve as placeholders for future AI integration.
            </p>
          </motion.div>

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
                <Button
                  size="sm"
                  className="ml-0 md:ml-auto bg-green-600 hover:bg-green-600/90"
                  onClick={analyzeAll}
                  disabled={selectedFiles.length === 0 || analyzing}
                >
                  {analyzing ? "Analyzing..." : "Analyze Images"}
                </Button>
              </div>

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

                        {/* Placeholder for future AI integration */}
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
      </section>
      {/* End Interactive Plant Analysis Section */}

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Advanced Technology for Modern Farming
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Leverage cutting-edge AI and satellite technology to maximize your agricultural potential
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className={`p-3 bg-background rounded-lg w-fit mb-4 ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-cyan-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              Ready to Transform Your Farm?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of farmers already using AgriSense to increase yields, 
              reduce costs, and farm more sustainably.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Your Free Trial"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3">
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <img src="https://harmless-tapir-303.convex.cloud/api/storage/dcab8a5a-6b8f-4af4-ad86-e3468d917e90" alt="AgriSense" className="w-6 h-6" />
              <span className="font-semibold">AgriSense</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 AgriSense. Powered by{" "}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                srm
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}