import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from "react-leaflet";
import Papa from "papaparse";
import { toast } from "sonner";
import L from "leaflet";

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

interface RiskMapContentProps {
  onRiskChange: (risk: string) => void;
  onLocationRequest: () => void;
  userLocation: [number, number] | null;
  gridData: GridData[];
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

export const RiskMapContent = ({ 
  userLocation, 
  gridData,
}: RiskMapContentProps) => {
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
  );
};
