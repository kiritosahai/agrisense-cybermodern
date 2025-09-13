import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
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
              <img src="/logo.svg" alt="AgriSense" className="w-8 h-8" />
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
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
              <Leaf className="w-3 h-3 mr-1" />
              Next-Generation Agriculture
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent">
              Precision Agriculture
              <br />
              <span className="text-foreground">Powered by AI</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Transform your farming with hyperspectral imaging, IoT sensors, and machine learning. 
              Monitor crop health, predict yields, and optimize resources in real-time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3">
                Watch Demo
              </Button>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="relative bg-gradient-to-br from-primary/5 to-cyan-500/5 rounded-2xl p-8 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Satellite className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Field Analysis</h3>
                        <p className="text-sm text-muted-foreground">Real-time monitoring</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>NDVI Health</span>
                        <span className="text-green-400">92%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Soil Moisture</span>
                        <span className="text-blue-400">68%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pest Risk</span>
                        <span className="text-orange-400">Low</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Yield Prediction</h3>
                        <p className="text-sm text-muted-foreground">AI-powered forecast</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-primary mb-2">8.2 tons/ha</div>
                    <div className="text-sm text-green-400">+15% vs last season</div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-pink-500/20 rounded-lg">
                        <Shield className="h-6 w-6 text-pink-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Alerts</h3>
                        <p className="text-sm text-muted-foreground">Smart notifications</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Irrigation scheduled</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Weather alert</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

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
              <img src="/logo.svg" alt="AgriSense" className="w-6 h-6" />
              <span className="font-semibold">AgriSense</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 AgriSense. Powered by{" "}
              <a
                href="https://vly.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                vly.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}