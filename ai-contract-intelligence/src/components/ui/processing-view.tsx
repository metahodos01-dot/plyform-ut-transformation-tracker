"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ScanLine, BrainCircuit } from "lucide-react";
import { Card } from "./card";

interface ProcessingViewProps {
    onComplete: () => void;
}

export function ProcessingView({ onComplete }: ProcessingViewProps) {
    const [steps, setSteps] = useState([
        { id: 1, label: "Google Cloud Document AI (OCR)", status: "pending", icon: ScanLine },
        { id: 2, label: "AWS Bedrock (Claude 3.5 Sonnet)", status: "pending", icon: BrainCircuit },
        { id: 3, label: "Generating Risk Report", status: "pending", icon: CheckCircle2 },
    ]);

    useEffect(() => {
        // Step 1: OCR
        setTimeout(() => updateStep(1, "active"), 500);
        setTimeout(() => updateStep(1, "completed"), 2500);

        // Step 2: AI
        setTimeout(() => updateStep(2, "active"), 2600);
        setTimeout(() => updateStep(2, "completed"), 4500);

        // Step 3: Report
        setTimeout(() => updateStep(3, "active"), 4600);
        setTimeout(() => {
            updateStep(3, "completed");
            setTimeout(onComplete, 500);
        }, 5500);

    }, []);

    const updateStep = (id: number, status: string) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };

    return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
            <Card className="w-full max-w-md p-6 bg-white shadow-lg space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-slate-900">Analyzing Contract...</h2>
                    <p className="text-sm text-slate-500">Securely processing in private cloud environment</p>
                </div>

                <div className="space-y-4">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-4">
                            <div className={`p-2 rounded-full border 
                                ${step.status === 'completed' ? 'bg-green-100 border-green-200 text-green-700' :
                                    step.status === 'active' ? 'bg-blue-100 border-blue-200 text-blue-700 animate-pulse' :
                                        'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                {step.status === 'active' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                    step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                                        <step.icon className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${step.status === 'completed' ? 'text-slate-900' :
                                        step.status === 'active' ? 'text-blue-700' : 'text-slate-400'
                                    }`}>
                                    {step.label}
                                </p>
                                {step.status === 'active' && <p className="text-xs text-blue-500 animate-pulse">Processing...</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
