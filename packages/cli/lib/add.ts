import fs from "node:fs/promises";
import path from "node:path";
import { addTrackedFile, getTrackedFiles } from "./storage";

export async function addFile(
  dir: string,
  filePath: string,
): Promise<string[]> {
  try {
    await fs.access(filePath, fs.constants.R_OK);
  } catch {
    throw new Error(`File not found or unreadable: ${filePath}`);
  }

  await addTrackedFile(dir, filePath);
  return getTrackedFiles(dir);
}

export const addAllFiles = async (
  dir: string,
  extension = ".xlsx",
): Promise<string[]> => {
  const files = await fs.readdir(dir);

  const trackingPromises = files
    .filter((file) => path.extname(file).toLowerCase() === extension)
    .map((file) => {
      const fullPath = path.join(dir, file);
      return addTrackedFile(dir, fullPath);
    });

  await Promise.all(trackingPromises);
  return getTrackedFiles(dir);
};

export async function handleAdd(
  dir: string,
  inputPath: string,
): Promise<string[]> {
  if (inputPath === "." || inputPath === "*") {
    return addAllFiles(dir);
  }

  return addFile(dir, inputPath);
}
