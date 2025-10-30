import { Card } from "./ui/card";

export const RiskLegend = () => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Risk Level Legend</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-risk-low rounded border-2 border-white" />
          <div>
            <p className="font-medium">Low Risk</p>
            <p className="text-sm text-muted-foreground">
              Safe conditions, minimal waterlogging
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-risk-moderate rounded border-2 border-white" />
          <div>
            <p className="font-medium">Moderate Risk</p>
            <p className="text-sm text-muted-foreground">
              Possible waterlogging, stay alert
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-risk-high rounded border-2 border-white" />
          <div>
            <p className="font-medium">High Risk</p>
            <p className="text-sm text-muted-foreground">
              Severe waterlogging, avoid area
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
