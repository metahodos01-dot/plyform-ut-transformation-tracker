import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TrafficLightWidgetProps {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
    count?: number;
}

export function TrafficLightWidget({ riskLevel, count }: TrafficLightWidgetProps) {
    let colorClass = "bg-gray-300";
    let label = "Unknown Status";

    if (riskLevel === 'LOW') {
        colorClass = "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]";
        label = "Low Risk";
    } else if (riskLevel === 'MEDIUM') {
        colorClass = "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]";
        label = "Medium Risk";
    } else if (riskLevel === 'HIGH') {
        colorClass = "bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.7)] animate-pulse";
        label = "High Risk";
    }

    return (
        <Card className="w-[200px] border-none shadow-md overflow-hidden bg-slate-50 dark:bg-slate-900">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-center">
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pb-6">
                <div className={cn("w-20 h-20 rounded-full transition-all duration-500", colorClass)} />
                {count !== undefined && (
                    <div className="mt-4 text-3xl font-bold">{count}</div>
                )}
            </CardContent>
        </Card>
    );
}
