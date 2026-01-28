"use client";

import { SplitScreenEditor } from "@/components/editor/SplitScreenEditor";
import { saveFeedback } from "@/services/feedback-service";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUploader } from "@/components/ui/file-uploader";
import { ProcessingView } from "@/components/ui/processing-view";

// Mock Data for Demo
const MOCK_PDF = "/demo_contract.pdf"; // Local file for reliable demo rendering
const MOCK_ANALYSIS = {
    summary: "Contratto di Fornitura Alpha 2018 (Scansione). Rilevate criticità su rinnovi e giurisdizione.",
    clauses: [
        {
            text: "Il presente contratto si rinnova tacitamente per ulteriori 5 anni in assenza di disdetta inviata 24 mesi prima.",
            risk: "HIGH",
            comment: "Rinnovo automatico con preavviso irragionevole (24 mesi). Standard di mercato è 6-12 mesi.",
            location: { page: 3, line: 12 }
        },
        {
            text: "Foro competente esclusivo: Isole Cayman.",
            risk: "HIGH",
            comment: "Giurisdizione non standard per contratto EU, alti costi legali e complessità di recupero crediti.",
            location: { "page": 14, "line": 5 }
        }
    ]
} as any;

export default function EditorDemoPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [analysis, setAnalysis] = useState(MOCK_ANALYSIS);
    const [viewState, setViewState] = useState<'upload' | 'processing' | 'editor'>('upload');
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string>(MOCK_PDF);

    const handleModify = async (idx: number, newText: string) => {
        if (!user) {
            alert("Login required to save feedback");
            return;
        }

        // 1. Update Local State (UI)
        const updatedClauses = [...analysis.clauses];
        const oldClause = updatedClauses[idx];
        updatedClauses[idx] = { ...oldClause, comment: newText, risk: "LOW" }; // Assume fixed
        setAnalysis({ ...analysis, clauses: updatedClauses });

        // 2. Save to Firestore (Learning Loop)
        try {
            await saveFeedback({
                contractId: "demo-contract-001",
                clauseText: oldClause.text,
                originalRisk: oldClause.risk,
                userCorrection: newText,
                userId: user.uid
            });
            alert("Feedback saved! The system will learn from this correction.");
        } catch (e) {
            console.error(e);
            alert("Failed to save feedback.");
        }
    };

    const handleApprove = () => {
        alert("Contract Approved! Signed timestamp generated.");
        router.push("/dashboard");
    };

    const onUploadComplete = (file?: File) => {
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setUploadedFileUrl(objectUrl);
        }
        setViewState('processing');
    };

    const renderContent = () => {
        switch (viewState) {
            case 'upload':
                return (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-slate-900">Upload Contract</h2>
                            <p className="text-slate-500 mt-2">AI-powered Multi-Tenant Analysis Suite</p>
                        </div>
                        <FileUploader onUploadComplete={onUploadComplete} />
                    </div>
                );
            case 'processing':
                return (
                    <div className="flex-1 bg-slate-50">
                        <ProcessingView onComplete={() => setViewState('editor')} />
                    </div>
                );
            case 'editor':
                return (
                    <div className="flex-1 overflow-hidden relative">
                        {/* Ensure user knows they can edit */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-700 pointer-events-none">
                            Try clicking on a Risk Card to correct the AI!
                        </div>
                        <SplitScreenEditor
                            pdfUrl={uploadedFileUrl}
                            analysis={analysis}
                            onApprove={handleApprove}
                            onModify={handleModify}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            <header className="h-14 border-b flex items-center px-4 bg-white shadow-sm z-10 justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-slate-900">Contract Intelligence</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold">ENTERPRISE</span>
                </div>
                {viewState === 'editor' && (
                    <div className="text-sm text-slate-500">
                        Analyzing: <span className="font-mono text-slate-900">Fornitura_Alpha_2018.pdf</span>
                    </div>
                )}
            </header>
            {renderContent()}
        </div>
    );
}
