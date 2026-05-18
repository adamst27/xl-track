import type { WorkbookData } from "./extract";

export interface NormalizedRow {
  sheet: string;
  rowIndex: number;
  cells: Record<string, string | number | boolean | null>;
}

export interface NormalizedData {
  version: string;
  normalizedAt: string;
  sheets: Record<string, NormalizedRow[]>;
}

export function normalize(workbookData: WorkbookData): NormalizedData {
  const sheets: Record<string, NormalizedRow[]> = {};

  for (const sheet of workbookData.sheets) {
    const normalizedRows: NormalizedRow[] = [];

    for (let i = 0; i < sheet.rows.length; i++) {
      const row = sheet.rows[i];
      if (!row) continue;
      const cells: Record<string, string | number | boolean | null> = {};

      for (const cell of row) {
        cells[cell.address] = cell.value;
      }

      normalizedRows.push({
        sheet: sheet.name,
        rowIndex: i,
        cells,
      });
    }

    sheets[sheet.name] = normalizedRows;
  }

  return {
    version: "1.0.0",
    normalizedAt: new Date().toISOString(),
    sheets,
  };
}

export function normalizeToString(workbookData: WorkbookData): string {
  const normalized = normalize(workbookData);
  return JSON.stringify(normalized, deterministicReplacer, 2);
}

function deterministicReplacer(key: string, value: unknown): unknown {
  if (key === "normalizedAt") {
    return undefined;
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const sortedKeys = Object.keys(value).sort();
    const sorted: Record<string, unknown> = {};

    for (const k of sortedKeys) {
      sorted[k] = (value as Record<string, unknown>)[k] ?? null;
    }

    return sorted;
  }

  return value;
}
