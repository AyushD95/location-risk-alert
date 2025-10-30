import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Papa from "papaparse";
import { toast } from "sonner";
import { Input } from "./ui/input";
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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState("");
  const [isTokenSet, setIsTokenSet] = useState(false);
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
          },
        });
      });
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !isTokenSet || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [72.82, 19.365],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      if (!map.current) return;

      // Add grid data to map
      gridData.forEach((grid) => {
        if (!grid.Grid_Center_Lon || !grid.Grid_Center_Lat) return;

        const color =
          grid.Dominant_Risk === "Low"
            ? "#22c55e"
            : grid.Dominant_Risk === "Moderate"
            ? "#f59e0b"
            : "#ef4444";

        const el = document.createElement("div");
        el.className = "risk-grid-marker";
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.backgroundColor = color;
        el.style.border = "2px solid white";
        el.style.borderRadius = "4px";
        el.style.opacity = "0.7";
        el.style.cursor = "pointer";

        new mapboxgl.Marker(el)
          .setLngLat([grid.Grid_Center_Lon, grid.Grid_Center_Lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="padding: 8px;">
                <strong>Risk Level: ${grid.Dominant_Risk}</strong><br/>
                Low: ${grid.Low_Count?.toFixed(1) || 0}<br/>
                Moderate: ${grid.Moderate_Count?.toFixed(1) || 0}<br/>
                High: ${grid.High_Count?.toFixed(1) || 0}
              </div>`
            )
          )
          .addTo(map.current!);
      });

      toast.success("Map loaded with risk zones!");
    });

    return () => {
      map.current?.remove();
    };
  }, [isTokenSet, mapboxToken, gridData]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.loading("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([longitude, latitude]);

        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
          });

          // Remove existing marker
          if (userMarker.current) {
            userMarker.current.remove();
          }

          // Add user location marker
          const el = document.createElement("div");
          el.className = "user-location-marker";
          el.style.width = "24px";
          el.style.height = "24px";
          el.style.backgroundColor = "#3b82f6";
          el.style.border = "3px solid white";
          el.style.borderRadius = "50%";
          el.style.boxShadow = "0 0 10px rgba(59, 130, 246, 0.5)";

          userMarker.current = new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .addTo(map.current!);

          // Check risk level
          checkRiskLevel(longitude, latitude);
        }

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

  const handleSetToken = () => {
    if (mapboxToken.trim()) {
      setIsTokenSet(true);
      toast.success("Mapbox token set! Loading map...");
    } else {
      toast.error("Please enter a valid Mapbox token");
    }
  };

  if (!isTokenSet) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Enter Mapbox Token</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
          Get your free Mapbox public token at{" "}
          <a
            href="https://mapbox.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            mapbox.com
          </a>
        </p>
        <div className="flex gap-2 w-full max-w-md">
          <Input
            type="text"
            placeholder="pk.ey..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSetToken}>Set Token</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Waterlogging Risk Map</h2>
        <Button onClick={requestLocation} size="lg">
          Get My Location
        </Button>
      </div>
      <div
        ref={mapContainer}
        className="w-full h-[600px] rounded-lg border shadow-glow"
      />
    </div>
  );
};
