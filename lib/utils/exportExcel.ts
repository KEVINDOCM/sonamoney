import * as XLSX from "xlsx"

export interface TransactionExportData {
  date: string
  category: string
  type: string
  amount: number
  notes: string | null
  currency?: string
}

export function exportTransactionsToExcel(
  transactions: TransactionExportData[],
  filename: string = "transactions"
) {
  // 1. Prepare data rows
  // Amount stored as NUMBER for Excel sum support
  const dataRows = transactions.map((t) => ({
    Date: t.date,
    Category: t.category,
    Type:
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
    Amount: t.amount, // Keep as number
    Currency: t.currency ?? "IDR",
    Notes: (t.notes ?? "")
      .replace(/^Payee:\s*/i, "")
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase()),
  }))

  // 2. Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(dataRows)

  // 3. Column widths
  worksheet["!cols"] = [
    { wch: 15 }, // Date
    { wch: 20 }, // Category
    { wch: 12 }, // Type
    { wch: 18 }, // Amount
    { wch: 10 }, // Currency
    { wch: 30 }, // Notes
  ]

  // 4. Summary calculations
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)
  const netBalance = totalIncome - totalExpense

  // 5. Append summary section
  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      [],
      ["", "", "Total Income", totalIncome],
      ["", "", "Total Expense", totalExpense],
      ["", "", "Net Balance", netBalance],
    ],
    { origin: -1 }
  )

  // 6. Create workbook and save
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Transactions"
  )
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

