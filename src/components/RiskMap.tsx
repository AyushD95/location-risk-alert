import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from "react-leaflet";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "./ui/button";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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

// Component to handle flying to user location
const LocationUpdater = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 2 });
    }
  }, [center, map]);
  
  return null;
};

export const RiskMap = ({ onRiskChange }: RiskMapProps) => {
  const [gridData, setGridData] = useState<GridData[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
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

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case "Low":
        return "#22c55e";
      case "Moderate":
        return "#f59e0b";
      case "High":
        return "#ef4444";
      default:
        return "#6b7280";
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
      <div className="w-full h-[600px] rounded-lg border shadow-glow overflow-hidden">
        <MapContainer
          center={[19.365, 72.82]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Render grid data */}
          {gridData.map((grid, index) => {
            if (!grid.Grid_Center_Lon || !grid.Grid_Center_Lat) return null;
            
            return (
              <CircleMarker
                key={index}
                center={[grid.Grid_Center_Lat, grid.Grid_Center_Lon]}
                radius={8}
                pathOptions={{
                  fillColor: getRiskColor(grid.Dominant_Risk),
                  fillOpacity: 0.7,
                  color: "#ffffff",
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-2">
                    <strong className="text-base">Risk Level: {grid.Dominant_Risk}</strong>
                    <div className="mt-2 space-y-1 text-sm">
                      <div>Low: {grid.Low_Count?.toFixed(1) || 0}</div>
                      <div>Moderate: {grid.Moderate_Count?.toFixed(1) || 0}</div>
                      <div>High: {grid.High_Count?.toFixed(1) || 0}</div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
          
          {/* User location marker */}
          {userLocation && (
            <Marker position={userLocation}>
              <Popup>
                <strong>Your Location</strong>
              </Popup>
            </Marker>
          )}
          
          {/* Component to handle location updates */}
          <LocationUpdater center={userLocation} />
        </MapContainer>
      </div>
    </div>
  );
};
