import * as XLSX from 'xlsx';
import { AnalysisResult } from './ai-service';

export function exportAnalysisToExcel(analysis: AnalysisResult, fileName: string = 'Contract_Analysis_Report') {
    if (!analysis) return;

    // 1. Prepare Summary Sheet
    const summaryData = [
        ["Report Generato il", new Date().toLocaleString()],
        ["Documento", fileName],
        ["Sommario", analysis.summary],
        [],
        ["Riepilogo Rischi"],
        ["Livello", "Conteggio"],
        ["HIGH", analysis.clauses.filter(c => c.risk === 'HIGH').length],
        ["MEDIUM", analysis.clauses.filter(c => c.risk === 'MEDIUM').length],
        ["LOW", analysis.clauses.filter(c => c.risk === 'LOW').length]
    ];

    // 2. Prepare Detail Sheet
    const detailData = analysis.clauses.map(clause => ({
        "Livello Rischio": clause.risk,
        "Pagina": clause.location.page,
        "Riga": clause.location.line,
        "Testo Clausola": clause.text,
        "Analisi AI / Commento": clause.comment
    }));

    // 3. Create Workbook
    const wb = XLSX.utils.book_new();

    // Add Summary Sheet
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Riepilogo");

    // Add Detail Sheet
    const wsDetail = XLSX.utils.json_to_sheet(detailData);

    // Auto-width columns for details
    const wscols = [
        { wch: 10 }, // Risk
        { wch: 8 },  // Page
        { wch: 8 },  // Line
        { wch: 80 }, // Text
        { wch: 60 }  // Comment
    ];
    wsDetail['!cols'] = wscols;
    XLSX.utils.book_append_sheet(wb, wsDetail, "Dettaglio Clausole");

    // 4. Download File
    XLSX.writeFile(wb, `${fileName}.xlsx`);
}
