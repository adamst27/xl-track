import { extract } from "./extract";
import { normalizeToString } from "./normalize";
import { hashString } from "./hash";
import { saveCommit } from "./storage";
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

  const commit = await saveCommit(dir, hash, message, normalizedStr);
  return commit;
}
