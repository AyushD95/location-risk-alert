import { useEffect, useState, lazy, Suspense } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "./ui/button";
import "leaflet/dist/leaflet.css";

interface GridData {
  Grid_Center_Lon: number;
  Grid_Center_Lat: number;
  Dominant_Risk: string;
  Low_Count: number;
  Moderate_Count: number;
  High_Count: number;
}

interface RiskMapProps {
  onRiskChange: (risk: string) => void;
}

// Dynamically import the map component to avoid SSR issues
const RiskMapContent = lazy(() => 
  import("./RiskMapContent").then(module => ({ default: module.RiskMapContent }))
);

export const RiskMap = ({ onRiskChange }: RiskMapProps) => {
  const [gridData, setGridData] = useState<GridData[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Load CSV data
    fetch("/data/vasai_grid_risk_mapping_1.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            setGridData(results.data as GridData[]);
            toast.success("Risk data loaded successfully!");
          },
        });
      })
      .catch(() => {
        toast.error("Failed to load risk data");
      });
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.loading("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        checkRiskLevel(longitude, latitude);
        
        toast.dismiss();
        toast.success("Location acquired!");
      },
      (error) => {
        toast.dismiss();
        toast.error("Failed to get location: " + error.message);
      }
    );
  };

  const checkRiskLevel = (lon: number, lat: number) => {
    // Find nearest grid
    let nearestGrid: GridData | null = null;
    let minDistance = Infinity;

    gridData.forEach((grid) => {
      const distance = Math.sqrt(
        Math.pow(grid.Grid_Center_Lon - lon, 2) +
          Math.pow(grid.Grid_Center_Lat - lat, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestGrid = grid;
      }
    });

    if (nearestGrid) {
      onRiskChange(nearestGrid.Dominant_Risk);

      const riskMessages = {
        Low: "You are in a Low risk zone. Stay alert for updates.",
        Moderate:
          "⚠️ You are in a Moderate risk zone. Monitor conditions closely.",
        High: "🚨 You are in a High risk zone! Take precautions immediately.",
      };

      const message =
        riskMessages[nearestGrid.Dominant_Risk as keyof typeof riskMessages] ||
        "Unknown risk level";

      if (nearestGrid.Dominant_Risk === "High") {
        toast.error(message, { duration: 10000 });
      } else if (nearestGrid.Dominant_Risk === "Moderate") {
        toast.warning(message, { duration: 8000 });
      } else {
        toast.success(message);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Waterlogging Risk Map</h2>
        <Button onClick={requestLocation} size="lg">
          Get My Location
        </Button>
      </div>
      <div className="w-full h-[600px] rounded-lg border shadow-glow overflow-hidden bg-muted/50">
        {isMounted ? (
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">Loading map...</p>
            </div>
          }>
            <RiskMapContent
              onRiskChange={onRiskChange}
              onLocationRequest={requestLocation}
              userLocation={userLocation}
              gridData={gridData}
            />
          </Suspense>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground">Initializing map...</p>
          </div>
        )}
      </div>
    </div>
  );
};
