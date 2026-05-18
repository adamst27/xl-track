import { extract } from "./extract";
import type { WorkbookData } from "./extract";
import { normalizeToString } from "./normalize";
import { hashString } from "./hash";
import { getLatestNormalizedData } from "./storage";
import fs from "node:fs/promises";

export interface StatusResult {
  isInitialized: boolean;
  isCommitted: boolean;
  isModified: boolean;
  currentHash: string;
  lastCommitHash: string | null;
}

export async function status(
  dir: string,
  filePath: string
): Promise<StatusResult> {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbookData: WorkbookData = await extract(filePath);
  const normalizedStr = normalizeToString(workbookData);
  const currentHash = await hashString(normalizedStr);

  const lastCommitData = await getLatestNormalizedData(dir);
  const isCommitted = lastCommitData !== null;
  const isModified = lastCommitData !== null && lastCommitData !== normalizedStr;

  let lastCommitHash: string | null = null;
  if (isCommitted) {
    lastCommitHash = await hashString(lastCommitData!);
  }

  return {
    isInitialized: true,
    isCommitted,
    isModified,
    currentHash,
    lastCommitHash,
  };
}
