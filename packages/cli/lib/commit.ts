import { extract } from "./extract";
import { normalizeToString } from "./normalize";
import { hashString } from "./hash";
import { saveCommit, getTrackedFiles } from "./storage";
import type { Commit } from "./storage";
import fs from "node:fs/promises";

export async function commit(
  dir: string,
  filePath: string,
  message: string
): Promise<Commit> {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbookData = await extract(filePath);
  const normalizedStr = normalizeToString(workbookData);
  const hash = await hashString(normalizedStr);

  const fileData = new Map<string, string>();
  fileData.set(filePath, normalizedStr);

  const commit = await saveCommit(dir, hash, message, [filePath], fileData);
  return commit;
}

export async function commitAll(
  dir: string,
  message: string
): Promise<Commit> {
  const tracked = await getTrackedFiles(dir);

  if (tracked.length === 0) {
    throw new Error("No tracked files. Run 'xlgit add <file>' first.");
  }

  const fileData = new Map<string, string>();
  const filePaths: string[] = [];

  for (const file of tracked) {
    try {
      await fs.access(file);
      const workbookData = await extract(file);
      const normalizedStr = normalizeToString(workbookData);
      fileData.set(file, normalizedStr);
      filePaths.push(file);
    } catch (err) {
      throw new Error(`Error reading ${file}: ${err.message}`);
    }
  }

  const combined = Array.from(fileData.values()).join("\n");
  const hash = await hashString(combined);

  const commit = await saveCommit(dir, hash, message, filePaths, fileData);
  return commit;
}
