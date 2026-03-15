import { describe, it, expect, vi } from "vitest"
import type * as XLSXType from "xlsx"

// Hoisted mock setup
const writeFileMock = vi.hoisted(() => vi.fn())
const jsonToSheetMock = vi.hoisted(() =>
  vi.fn(() => ({
    "!ref": "A1:E3",
    "!cols": [] as { wch: number }[],
  }))
)
const bookNewMock = vi.hoisted(() => vi.fn(() => ({})))
const bookAppendSheetMock = vi.hoisted(() => vi.fn())
const sheetAddAoaMock = vi.hoisted(() => vi.fn())

vi.mock("xlsx", async () => {
  const actual = await vi.importActual<typeof XLSXType>("xlsx")
  return {
    ...actual,
    utils: {
      ...actual.utils,
      json_to_sheet: jsonToSheetMock,
      book_new: bookNewMock,
      book_append_sheet: bookAppendSheetMock,
      sheet_add_aoa: sheetAddAoaMock,
    },
    writeFile: writeFileMock,
  }
})

import {
  exportTransactionsToExcel,
} from "@/lib/utils/exportExcel"

describe("exportExcel utils", () => {
  it("calls writeFile with correct filename", () => {
    exportTransactionsToExcel(
      [
        {
          date: "2024-01-01",
          category: "Food",
          type: "expense",
          amount: 50000,
          notes: null,
        },
      ],
      "test-export"
    )

    expect(writeFileMock).toHaveBeenCalledWith(
      expect.anything(),
      "test-export.xlsx"
    )
  })

  it("handles empty transactions array", () => {
    expect(() =>
      exportTransactionsToExcel([], "empty-test")
    ).not.toThrow()
  })

  it("uses default filename when not provided", () => {
    exportTransactionsToExcel([])

    expect(writeFileMock).toHaveBeenCalledWith(
      expect.anything(),
      "transactions.xlsx"
    )
  })
})
