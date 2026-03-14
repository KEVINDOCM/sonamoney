"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

import type { Transaction } from "@/types";
import { useGetCategories } from "@/hooks/useGetCategories";
import { exportTransactionsToExcel } from "@/lib/utils/exportExcel";
import { useTranslation } from "@/lib/i18n/useTranslation";

export interface ExportTransactionsButtonsProps {
  items: Transaction[];
}

export function ExportTransactionsButtons({ items }: ExportTransactionsButtonsProps) {
  const { categories, isLoading: isCategoriesLoading } = useGetCategories();
  const { t, mounted } = useTranslation();

  const handleExportPdf = async () => {
    const table = document.getElementById("transactions-table");
    if (!table) {
      window.alert("Unable to find transactions table to export.");
      return;
    }

    const canvas = await html2canvas(table);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save("transactions.pdf");
  };

  const handleExportExcel = () => {
    const categoryMap = new Map((categories || []).map((c) => [c.id, c.name]));

    const exportData = items.map((transaction) => ({
      date: transaction.date,
      category: categoryMap.get(transaction.category_id) || "Uncategorized",
      type: transaction.type,
      amount: transaction.amount,
      notes: transaction.notes,
    }));

    exportTransactionsToExcel(exportData);
  };

  const isDisabled = items.length === 0 || isCategoriesLoading;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleExportPdf}
        disabled={items.length === 0}
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
        {isDisabled ? "..." : "↓ PDF"}
      </button>
      <button
        onClick={handleExportExcel}
        disabled={isDisabled}
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
        {isDisabled ? "..." : "↓ Excel"}
      </button>
    </div>
  );
}

