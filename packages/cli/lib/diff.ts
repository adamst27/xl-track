import { extract } from "./extract";
import { normalize } from "./normalize";
import type { NormalizedData } from "./normalize";
import { getLatestNormalizedData, getTrackedFiles } from "./storage";
import { compareSnapshots } from "./compare";
import type { DiffResult } from "./compare";
import fs from "node:fs/promises";

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m",
};

function colorize(text: string, color: string): string {
  return `${color}${text}${COLORS.reset}`;
}

function formatValue(val: string | number | boolean | null): string {
  if (val === null || val === undefined) return "(empty)";
  return String(val);
}

function formatChangeSymbol(type: string): string {
  switch (type) {
    case "ADDED":
      return colorize("+", COLORS.green);
    case "DELETED":
      return colorize("-", COLORS.red);
    case "MODIFIED":
      return colorize("~", COLORS.yellow);
    default:
      return " ";
  }
}

function formatDiff(file: string, diffResults: DiffResult[]): string {
  const lines: string[] = [];

  lines.push(colorize(`\n${file}`, COLORS.bold));
  lines.push(colorize("═".repeat(50), COLORS.gray));

  for (const result of diffResults) {
    lines.push(colorize(`  Sheet: ${result.sheet}`, COLORS.cyan));

    for (const rowChange of result.rowChanges) {
      const symbol = formatChangeSymbol(rowChange.type);
      lines.push(
        `    ${symbol} Row ${rowChange.rowIndex}: ${rowChange.type}`
      );

      for (const cellChange of rowChange.cellChanges) {
        const oldVal = formatValue(cellChange.oldValue);
        const newVal = formatValue(cellChange.newValue);

        if (rowChange.type === "ADDED") {
          lines.push(
            `      ${cellChange.address}: ${colorize(newVal, COLORS.green)}`
          );
        } else if (rowChange.type === "DELETED") {
          lines.push(
            `      ${cellChange.address}: ${colorize(oldVal, COLORS.red)}`
          );
        } else {
          lines.push(
            `      ${cellChange.address}: ${colorize(oldVal, COLORS.red)} -> ${colorize(newVal, COLORS.green)}`
          );
        }
      }
    }
  }

  return lines.join("\n");
}

export async function diff(dir: string, filePath: string): Promise<string> {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  const latestData = await getLatestNormalizedData(dir, filePath);
  if (!latestData) {
    return `${filePath}: No commits yet.`;
  }

  const oldData: NormalizedData = JSON.parse(latestData);

  const workbookData = await extract(filePath);
  const newData: NormalizedData = normalize(workbookData);

  const diffResults = compareSnapshots(oldData, newData);

  if (diffResults.length === 0) {
    return `${filePath}: No changes detected.`;
  }

  return formatDiff(filePath, diffResults);
}

export async function diffAll(dir: string): Promise<string> {
  const tracked = await getTrackedFiles(dir);

  if (tracked.length === 0) {
    return "No tracked files. Run 'xlgit add <file>' first.";
  }

  const outputs: string[] = [];
  let hasChanges = false;

  for (const file of tracked) {
    try {
      const result = await diff(dir, file);
      if (!result.includes("No changes detected") && !result.includes("No commits yet")) {
        hasChanges = true;
      }
      outputs.push(result);
    } catch (err) {
      outputs.push(`${file}: Error - ${err.message}`);
    }
  }

  if (!hasChanges) {
    return "No changes detected in tracked files.";
  }

  return outputs.join("\n");
}
