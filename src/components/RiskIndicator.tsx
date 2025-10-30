import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Card } from "./ui/card";

interface RiskIndicatorProps {
  riskLevel: string;
}

export const RiskIndicator = ({ riskLevel }: RiskIndicatorProps) => {
  const getRiskConfig = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return {
          icon: CheckCircle,
          color: "risk-low",
          bg: "risk-low-light",
          text: "Low Risk",
          description: "Safe conditions. Continue monitoring weather updates.",
        };
      case "moderate":
        return {
          icon: AlertTriangle,
          color: "risk-moderate",
          bg: "risk-moderate-light",
          text: "Moderate Risk",
          description: "Exercise caution. Avoid low-lying areas if possible.",
        };
      case "high":
        return {
          icon: AlertCircle,
          color: "risk-high",
          bg: "risk-high-light",
          text: "High Risk",
          description:
            "Danger! Avoid travel. Stay indoors and follow emergency protocols.",
        };
      default:
        return {
          icon: AlertCircle,
          color: "muted",
          bg: "muted",
          text: "Unknown",
          description: "Enable location to check your risk level.",
        };
    }
  };

  const config = getRiskConfig(riskLevel);
  const Icon = config.icon;

  return (
    <Card className={`p-6 bg-${config.bg} border-${config.color} border-2`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 bg-${config.color} rounded-full`}>
          <Icon className={`w-8 h-8 text-${config.color}-foreground`} />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-2">{config.text}</h3>
          <p className="text-foreground/80">{config.description}</p>
        </div>
      </div>
    </Card>
  );
};
