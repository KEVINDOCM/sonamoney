import * as XLSX from "xlsx";
import { formatCurrency } from "./formatCurrency";
import { formatShortDate } from "./formatDate";

export interface TransactionExportData {
    date: string;
    category: string;
    type: string;
    amount: number;
    notes: string | null;
}

export function exportTransactionsToExcel(transactions: TransactionExportData[]) {
    // 1. Prepare data rows
    const dataRows = transactions.map((t) => ({
        Date: formatShortDate(t.date),
        Category: t.category,
        Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
        Amount: formatCurrency(t.amount),
        Notes: (t.notes || "")
            .replace(/^Payee:\s*/i, "")
            .trim()
            .replace(/^\w/, (c) => c.toUpperCase()),
    }));

    // 2. Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataRows);

    // 3. Configure Column Widths
    worksheet["!cols"] = [
        { wch: 15 }, // Date
        { wch: 20 }, // Category
        { wch: 12 }, // Type
        { wch: 20 }, // Amount
        { wch: 30 }, // Notes
    ];

    // 4. Summary Calculations
    const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpense;

    // 5. Add Summary Section
    // We add an empty row then the summary rows
    XLSX.utils.sheet_add_aoa(
        worksheet,
        [
            [], // Empty row
            ["Total Income", "", "", formatCurrency(totalIncome)],
            ["Total Expense", "", "", formatCurrency(totalExpense)],
            ["Net Balance", "", "", formatCurrency(netBalance)],
        ],
        { origin: -1 } // Append at the end
    );

    // 6. Header Styling (Requires supported XLSX versions like xlsx-js-style)
    // We apply the 's' (style) property as requested.
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!worksheet[address]) continue;
        worksheet[address].s = {
            font: { bold: true, color: { rgb: "FFFFFFFF" } },
            fill: { fgColor: { rgb: "FF3B82F6" } },
        };
    }

    // Bold Summary Labels (Column A) and Values (Column D)
    const summaryStartRow = dataRows.length + 2; // +1 for header, +1 for empty row
    for (let r = summaryStartRow; r < summaryStartRow + 3; r++) {
        const labelAddr = "A" + (r + 1);
        const valueAddr = "D" + (r + 1);
        if (worksheet[labelAddr]) worksheet[labelAddr].s = { font: { bold: true } };
        if (worksheet[valueAddr]) worksheet[valueAddr].s = { font: { bold: true } };
    }

    // 7. Create Workbook and Save
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "transactions.xlsx");
}
