import { join } from "node:path";
import XLSX from "xlsx";
import fs from "node:fs/promises";

export interface CellData {
  address: string;
  value: string | number | boolean | null;
}

export interface SheetData {
  name: string;
  rows: CellData[][];
  dimensions: {
    rows: number;
    cols: number;
  };
}

export interface WorkbookData {
  sheets: SheetData[];
}

export async function extract(filePath: string): Promise<WorkbookData> {
  const fileBuffer = await fs.readFile(filePath);
  const workbook = XLSX.read(fileBuffer, {
    type: "buffer",
    cellStyles: false,
    cellFormula: false,
    cellDates: true,
    cellNF: false,
  });

  const sheets: SheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const sheetData = extractSheet(sheet, sheetName);
    sheets.push(sheetData);
  }

  return { sheets };
}

function extractSheet(sheet: XLSX.WorkSheet, name: string): SheetData {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  const rows: CellData[][] = [];

  for (let R = range.s.r; R <= range.e.r; R++) {
    const rowData: CellData[] = [];

    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[cellAddress];

      let value: string | number | boolean | null = null;

      if (cell) {
        switch (cell.t) {
          case "s":
            value = cell.v ?? null;
            break;
          case "n":
            value = cell.v ?? null;
            break;
          case "b":
            value = cell.v ?? null;
            break;
          case "z":
          case undefined:
            value = null;
            break;
          default:
            value = null;
        }
      }

      rowData.push({
        address: cellAddress,
        value,
      });
    }

    rows.push(rowData);
  }

  return {
    name,
    rows,
    dimensions: {
      rows: range.e.r - range.s.r + 1,
      cols: range.e.c - range.s.c + 1,
    },
  };
}
