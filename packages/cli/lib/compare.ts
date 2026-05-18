import type { NormalizedData, NormalizedRow } from "./normalize";

export type ChangeType = "ADDED" | "DELETED" | "MODIFIED" | "UNCHANGED";

export interface CellChange {
  address: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
}

export interface RowChange {
  sheet: string;
  rowIndex: number;
  type: ChangeType;
  cellChanges: CellChange[];
}

export interface DiffResult {
  sheet: string;
  rowChanges: RowChange[];
}

function rowsToMap(rows: NormalizedRow[]): Map<number, NormalizedRow> {
  const map = new Map<number, NormalizedRow>();
  for (const row of rows) {
    map.set(row.rowIndex, row);
  }
  return map;
}

function compareCells(
  oldCells: Record<string, string | number | boolean | null>,
  newCells: Record<string, string | number | boolean | null>
): CellChange[] {
  const changes: CellChange[] = [];
  const allAddresses = new Set([
    ...Object.keys(oldCells),
    ...Object.keys(newCells),
  ]);

  for (const address of allAddresses) {
    const oldValue = oldCells[address];
    const newValue = newCells[address];

    if (oldValue !== newValue) {
      changes.push({ address, oldValue: oldValue ?? null, newValue: newValue ?? null });
    }
  }

  return changes;
}

export function compareSnapshots(
  oldData: NormalizedData,
  newData: NormalizedData
): DiffResult[] {
  const allSheetNames = new Set([
    ...Object.keys(oldData.sheets),
    ...Object.keys(newData.sheets),
  ]);

  const results: DiffResult[] = [];

  for (const sheetName of allSheetNames) {
    const oldRows = oldData.sheets[sheetName] || [];
    const newRows = newData.sheets[sheetName] || [];

    const oldMap = rowsToMap(oldRows);
    const newMap = rowsToMap(newRows);

    const allRowIndices = new Set([
      ...oldMap.keys(),
      ...newMap.keys(),
    ]);

    const rowChanges: RowChange[] = [];

    for (const rowIndex of allRowIndices) {
      const oldRow = oldMap.get(rowIndex);
      const newRow = newMap.get(rowIndex);

      if (!oldRow && newRow) {
        const cellChanges: CellChange[] = Object.entries(newRow.cells).map(
          ([address, value]) => ({
            address,
            oldValue: null,
            newValue: value,
          })
        );
        rowChanges.push({
          sheet: sheetName,
          rowIndex,
          type: "ADDED",
          cellChanges,
        });
      } else if (oldRow && !newRow) {
        const cellChanges: CellChange[] = Object.entries(oldRow.cells).map(
          ([address, value]) => ({
            address,
            oldValue: value,
            newValue: null,
          })
        );
        rowChanges.push({
          sheet: sheetName,
          rowIndex,
          type: "DELETED",
          cellChanges,
        });
      } else if (oldRow && newRow) {
        const cellChanges = compareCells(oldRow.cells, newRow.cells);
        if (cellChanges.length > 0) {
          rowChanges.push({
            sheet: sheetName,
            rowIndex,
            type: "MODIFIED",
            cellChanges,
          });
        }
      }
    }

    if (rowChanges.length > 0) {
      results.push({
        sheet: sheetName,
        rowChanges,
      });
    }
  }

  return results;
}
