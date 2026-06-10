import { join } from "node:path";
import fs from "node:fs/promises";
import { addTrackedFile, getTrackedFiles } from "./storage";

export async function add(dir: string, filePath: string): Promise<string[]> {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  await addTrackedFile(dir, filePath);

  const tracked = await getTrackedFiles(dir);
  return tracked;
}
