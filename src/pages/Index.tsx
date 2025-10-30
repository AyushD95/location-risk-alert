import { useState } from "react";
import { RiskMap } from "@/components/RiskMap";
import { RiskIndicator } from "@/components/RiskIndicator";
import { RiskLegend } from "@/components/RiskLegend";
import { Droplets } from "lucide-react";

const Index = () => {
  const [currentRisk, setCurrentRisk] = useState("unknown");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary shadow-glow sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-foreground/10 rounded-lg">
              <Droplets className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground">
                Waterlogging Alert System
              </h1>
              <p className="text-primary-foreground/80">
                Real-time risk monitoring for Vasai region
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <RiskMap onRiskChange={setCurrentRisk} />
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-6">
            <RiskIndicator riskLevel={currentRisk} />
            <RiskLegend />
            
            {/* Info Card */}
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">How it works</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">1.</span>
                  <span>Click "Get My Location" to enable location access</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">2.</span>
                  <span>View risk zones displayed on the map</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">3.</span>
                  <span>Receive real-time alerts based on your location</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">4.</span>
                  <span>Click on grid markers for detailed risk data</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
