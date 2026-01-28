import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analysis Report");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const generateMeetingReport = (riskSummary: any) => {
    // Generate a summary row
    const data = [
        { Metric: "Total Contracts", Value: riskSummary.total },
        { Metric: "High Risk", Value: riskSummary.high },
        { Metric: "Medium Risk", Value: riskSummary.medium },
        { Metric: "Low Risk", Value: riskSummary.low },
        { Metric: "Generated At", Value: new Date().toISOString() }
    ];
    exportToExcel(data, `Meeting_Report_${new Date().toISOString().split('T')[0]}`);
}
