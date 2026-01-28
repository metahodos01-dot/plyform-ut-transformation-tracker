"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalysisResult } from "@/services/ai-service";
import { exportAnalysisToExcel } from "@/services/export-service";

interface SplitScreenEditorProps {
    pdfUrl: string; // URL or base64 data URI
    analysis: AnalysisResult | null;
    onApprove: (data: any) => void;
    onModify: (clauseIndex: number, newText: string) => void;
}

export function SplitScreenEditor({ pdfUrl, analysis, onApprove, onModify }: SplitScreenEditorProps) {
    const [selectedClause, setSelectedClause] = useState<number | null>(null);

    // Mock modify handler for demo
    const handleFeedback = (idx: number, clause: any) => {
        const correction = prompt("Modify AI analysis or Risk level:", clause.comment);
        if (correction) {
            onModify(idx, correction);
        }
    };

    return (
        <div className="flex h-[85vh] gap-4 p-4">
            {/* Left Pane: PDF Viewer */}
            <div className="w-1/2 h-full bg-gray-100 rounded-lg shadow-inner overflow-hidden border border-gray-300 flex flex-col">
                <div className="bg-slate-200 border-b border-slate-300 px-3 py-2">
                    <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                        📄 Documento Originale
                    </span>
                </div>
                <iframe src={pdfUrl} className="w-full flex-1 bg-white" title="Contract PDF" />
            </div>

            {/* Right Pane: AI Analysis */}
            <div className="w-1/2 h-full flex flex-col gap-4 overflow-y-auto">
                <Card className="p-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <h2 className="text-xl font-bold mb-2">AI Intelligence Report</h2>
                    <p className="text-sm text-gray-600">{analysis?.summary || "Analyzing document..."}</p>
                </Card>

                <div className="space-y-4 pb-20">
                    {analysis?.clauses.map((clause, idx) => (
                        <Card
                            key={idx}
                            className={`p-4 border-l-4 cursor-pointer transition-all ${clause.risk === 'HIGH' ? 'border-l-red-500 bg-red-50' :
                                clause.risk === 'MEDIUM' ? 'border-l-yellow-500 bg-yellow-50' :
                                    'border-l-green-500 bg-green-50'
                                } hover:scale-[1.01]`}
                            onClick={() => setSelectedClause(idx)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${clause.risk === 'HIGH' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                                    }`}>
                                    {clause.risk} RISK
                                </span>
                                <span className="text-xs text-gray-500">
                                    Page {clause.location.page}, Line {clause.location.line}
                                </span>
                            </div>
                            <p className="font-mono text-sm bg-white/60 p-2 rounded mb-2 italic text-slate-900">
                                "{clause.text}"
                            </p>
                            <p className="text-sm text-gray-800">
                                🤖 {clause.comment}
                            </p>
                            <div className="mt-3 flex gap-2">
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleFeedback(idx, clause); }}>
                                    Correggi Analisi
                                </Button>
                                <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700">
                                    Cita
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Sticky Footer Actions */}
                <div className="sticky bottom-0 bg-white p-4 border-t flex justify-between items-center shadow-lg rounded-t-lg">
                    <span className="text-sm text-gray-500">Revisione Contratto</span>
                    <div className="flex gap-2">
                        <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => exportAnalysisToExcel(analysis!, "Report_Analisi_Contratto")}>
                            📑 Salva Report (Excel)
                        </Button>
                        <div className="w-px h-8 bg-slate-300 mx-2" />
                        <Button variant="destructive">Rifiuta</Button>
                        <Button variant="outline">Consulta Team</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={onApprove}>Approva & Firma</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
