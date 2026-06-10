import { extract } from "./extract";
import type { WorkbookData } from "./extract";
import { normalizeToString } from "./normalize";
import { hashString } from "./hash";
import { getLatestNormalizedData, getTrackedFiles } from "./storage";
import fs from "node:fs/promises";

export interface FileStatusResult {
  file: string;
  isCommitted: boolean;
  isModified: boolean;
  currentHash: string;
  lastCommitHash: string | null;
}

export async function status(
  dir: string,
  filePath: string
): Promise<FileStatusResult> {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbookData: WorkbookData = await extract(filePath);
  const normalizedStr = normalizeToString(workbookData);
  const currentHash = await hashString(normalizedStr);

  const lastCommitData = await getLatestNormalizedData(dir, filePath);
  const isCommitted = lastCommitData !== null;
  const isModified = lastCommitData !== null && lastCommitData !== normalizedStr;

  let lastCommitHash: string | null = null;
  if (isCommitted) {
    lastCommitHash = await hashString(lastCommitData!);
  }

  return {
    file: filePath,
    isCommitted,
    isModified,
    currentHash,
    lastCommitHash,
  };
}

export async function statusAll(dir: string): Promise<FileStatusResult[]> {
  const tracked = await getTrackedFiles(dir);

  if (tracked.length === 0) {
    return [];
  }

  const results: FileStatusResult[] = [];
  for (const file of tracked) {
    try {
      results.push(await status(dir, file));
    } catch (err) {
      results.push({
        file,
        isCommitted: false,
        isModified: false,
        currentHash: "",
        lastCommitHash: null,
      });
    }
  }

  return results;
}
