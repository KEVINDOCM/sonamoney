"use client"

import { useState } from "react"
import type { Transaction } from "@/types"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { useUserData } from "@/lib/contexts/UserDataContext"

export interface ExportTransactionsButtonsProps {
  items: Transaction[]
}

export function ExportTransactionsButtons({
  items,
}: ExportTransactionsButtonsProps) {
  const { categories } = useUserData()
  const { mounted } = useTranslation()
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isExcelLoading, setIsExcelLoading] =
    useState(false)

  const categoryMap = new Map(
    (categories ?? []).map((c) => [c.id, c.name])
  )

  const handleExportPdf = async () => {
    if (items.length === 0) return
    setIsPdfLoading(true)

    try {
      // Dynamic import — lazy load jsPDF
      const { default: jsPDF } = await import("jspdf")
      await import("jspdf-autotable")

      const doc = new jsPDF("p", "mm", "a4")
      const pageWidth = doc.internal.pageSize.getWidth()

      // Title
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Transaction Report", pageWidth / 2, 20, {
        align: "center",
      })

      // Date range
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(107, 114, 128)
      doc.text(
        `Generated: ${new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`,
        pageWidth / 2,
        28,
        { align: "center" }
      )
      doc.text(
        `Total: ${items.length} transactions`,
        pageWidth / 2,
        34,
        { align: "center" }
      )

      // Summary
      const totalIncome = items
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0)
      const totalExpense = items
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 196, 140) // income green
      doc.text(
        `Income: +${totalIncome.toLocaleString("id-ID")}`,
        20,
        45
      )
      doc.setTextColor(255, 91, 91) // expense red
      doc.text(
        `Expense: -${totalExpense.toLocaleString("id-ID")}`,
        pageWidth / 2,
        45
      )
      doc.setTextColor(0, 185, 167) // teal
      doc.text(
        `Net: ${(totalIncome - totalExpense).toLocaleString("id-ID")}`,
        20,
        53
      )

      // Table data
      const tableData = items.map((t) => [
        t.date,
        categoryMap.get(t.category_id) ?? "Uncategorized",
        t.type.charAt(0).toUpperCase() + t.type.slice(1),
        `${t.type === "income" ? "+" : "-"}${t.amount.toLocaleString("id-ID")}`,
        t.currency ?? "IDR",
        t.notes ?? "",
      ])

      // Use autoTable if available
      interface JsPDFWithAutoTable {
        autoTable?: (options: Record<string, unknown>) => void
        setFontSize: (size: number) => void
        setTextColor: (r: number, g: number, b: number) => void
        text: (text: string, x: number, y: number) => void
        addPage: () => void
        save: (filename: string) => void
      }
      const docWithTable = doc as unknown as JsPDFWithAutoTable

      if (docWithTable.autoTable) {
        docWithTable.autoTable({
          head: [[
            "Date", "Category", "Type",
            "Amount", "Currency", "Notes"
          ]],
          body: tableData,
          startY: 58,
          styles: {
            fontSize: 8,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [0, 185, 167],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250],
          },
          columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 30 },
            2: { cellWidth: 18 },
            3: { cellWidth: 28 },
            4: { cellWidth: 18 },
            5: { cellWidth: "auto" },
          },
        })
      } else {
        // Fallback: simple text list
        doc.setFontSize(8)
        doc.setTextColor(26, 26, 46)
        let y = 60
        tableData.forEach((row) => {
          if (y > 270) {
            doc.addPage()
            y = 20
          }
          doc.text(row.join(" | "), 14, y)
          y += 6
        })
      }

      const today = new Date()
        .toISOString()
        .split("T")[0]
      doc.save(`transactions-${today}.pdf`)
    } catch (err) {
      console.error("PDF export error:", err)
      window.alert("Failed to export PDF. Please try again.")
    } finally {
      setIsPdfLoading(false)
    }
  }

  const handleExportExcel = async () => {
    if (items.length === 0) return
    setIsExcelLoading(true)

    try {
      // Lazy load — only when user clicks
      const { exportTransactionsToExcel } =
        await import("@/lib/utils/exportExcel")

      const exportData = items.map((t) => ({
        date: t.date,
        category:
          categoryMap.get(t.category_id) ??
          "Uncategorized",
        type: t.type,
        amount: t.amount,
        currency: t.currency ?? "IDR",
        notes: t.notes,
      }))

      const today = new Date()
        .toISOString()
        .split("T")[0]
      exportTransactionsToExcel(
        exportData,
        `transactions-${today}` 
      )
    } catch (err) {
      console.error("Excel export error:", err)
    } finally {
      setIsExcelLoading(false)
    }
  }

  const isDisabled = items.length === 0

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleExportPdf}
        disabled={isDisabled || isPdfLoading}
        className="
          flex items-center gap-1
          border border-[#00B9A7] text-[#00B9A7]
          rounded-full px-3 py-1.5
          text-xs font-semibold
          hover:bg-[#00B9A7] hover:text-white
          active:scale-95
          transition-all duration-200
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
      >
        {isPdfLoading ? "..." : "↓ PDF"}
      </button>
      <button
        onClick={handleExportExcel}
        disabled={isDisabled || isExcelLoading}
        className="
          flex items-center gap-1
          border border-[#00C48C] text-[#00C48C]
          rounded-full px-3 py-1.5
          text-xs font-semibold
          hover:bg-[#00C48C] hover:text-white
          active:scale-95
          transition-all duration-200
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
      >
        {isExcelLoading ? "..." : "↓ Excel"}
      </button>
    </div>
  )
}

