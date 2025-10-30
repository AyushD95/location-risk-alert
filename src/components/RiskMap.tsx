import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "./ui/button";

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

export const RiskMap = ({ onRiskChange }: RiskMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const gridLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [gridData, setGridData] = useState<GridData[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Initialize map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current).setView([19.365, 72.82], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Load CSV data once
  useEffect(() => {
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

  // Render grid markers when data or map changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous layer
    if (gridLayerRef.current) {
      gridLayerRef.current.clearLayers();
      map.removeLayer(gridLayerRef.current);
    }

    const group = L.layerGroup();

    const getRiskColor = (risk: string): string => {
      switch (risk) {
        case "Low":
          return "#22c55e"; // hsl(var(--risk-low))
        case "Moderate":
          return "#f59e0b"; // hsl(var(--risk-moderate))
        case "High":
          return "#ef4444"; // hsl(var(--risk-high))
        default:
          return "#6b7280";
      }
    };

    gridData.forEach((grid) => {
      if (!grid.Grid_Center_Lon || !grid.Grid_Center_Lat) return;

      const marker = L.circleMarker([grid.Grid_Center_Lat, grid.Grid_Center_Lon], {
        radius: 8,
        color: "#ffffff",
        weight: 2,
        fillColor: getRiskColor(grid.Dominant_Risk),
        fillOpacity: 0.7,
      });

      marker.bindPopup(
        `<div style="padding:6px">
          <strong>Risk Level: ${grid.Dominant_Risk}</strong><br/>
          Low: ${grid.Low_Count?.toFixed(1) || 0}<br/>
          Moderate: ${grid.Moderate_Count?.toFixed(1) || 0}<br/>
          High: ${grid.High_Count?.toFixed(1) || 0}
        </div>`
      );

      marker.addTo(group);
    });

    group.addTo(map);
    gridLayerRef.current = group;
  }, [gridData]);

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

        const map = mapRef.current;
        if (map) {
          map.flyTo([latitude, longitude], 15, { duration: 1.5 });

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            userMarkerRef.current = L.marker([latitude, longitude]).addTo(map);
          }
        }

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
    let nearestGrid: GridData | null = null;
    let minDistance = Infinity;

    gridData.forEach((grid) => {
      const distance = Math.sqrt(
        Math.pow(grid.Grid_Center_Lon - lon, 2) + Math.pow(grid.Grid_Center_Lat - lat, 2)
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
        Moderate: "⚠️ You are in a Moderate risk zone. Monitor conditions closely.",
        High: "🚨 You are in a High risk zone! Take precautions immediately.",
      } as const;

      const message = (riskMessages as any)[nearestGrid.Dominant_Risk] || "Unknown risk level";

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
      <div ref={containerRef} className="w-full h-[600px] rounded-lg border shadow-glow overflow-hidden" />
    </div>
  );
};
