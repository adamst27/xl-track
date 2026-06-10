import { join, basename } from "node:path";
import fs from "node:fs/promises";

export interface Commit {
  hash: string;
  message: string;
  timestamp: string;
  files: string[];
}

const VCS_DIR = ".xlvc";
const OBJECTS_DIR = "objects";
const HEAD_FILE = "HEAD";
const LOG_FILE = "log.json";
const TRACKED_FILE = "tracked.json";

// -- Tracked files --

export async function getTrackedFiles(dir: string): Promise<string[]> {
  const trackedPath = join(dir, VCS_DIR, TRACKED_FILE);
  try {
    const content = await fs.readFile(trackedPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function addTrackedFile(dir: string, filePath: string): Promise<void> {
  const tracked = await getTrackedFiles(dir);
  if (!tracked.includes(filePath)) {
    tracked.push(filePath);
    const trackedPath = join(dir, VCS_DIR, TRACKED_FILE);
    await fs.writeFile(trackedPath, JSON.stringify(tracked, null, 2));
  }
}

export async function removeTrackedFile(dir: string, filePath: string): Promise<void> {
  const tracked = await getTrackedFiles(dir);
  const updated = tracked.filter((f) => f !== filePath);
  const trackedPath = join(dir, VCS_DIR, TRACKED_FILE);
  await fs.writeFile(trackedPath, JSON.stringify(updated, null, 2));
}

// -- Commit log --

export async function getLatestCommitHash(dir: string): Promise<string | null> {
  const logPath = join(dir, VCS_DIR, LOG_FILE);
  try {
    const logContent = await fs.readFile(logPath, "utf-8");
    const commits: Commit[] = JSON.parse(logContent);

    if (commits.length === 0) return null;
    const lastCommit = commits[commits.length - 1];
    if (!lastCommit) return null;
    return lastCommit.hash;
  } catch {
    return null;
  }
}

export async function getLatestCommit(dir: string): Promise<Commit | null> {
  const logPath = join(dir, VCS_DIR, LOG_FILE);
  try {
    const logContent = await fs.readFile(logPath, "utf-8");
    const commits: Commit[] = JSON.parse(logContent);

    if (commits.length === 0) return null;
    return commits[commits.length - 1];
  } catch {
    return null;
  }
}

// -- Per-file normalized data --

export async function getLatestNormalizedData(
  dir: string,
  filePath: string
): Promise<string | null> {
  const latestCommit = await getLatestCommit(dir);
  if (!latestCommit) return null;

  if (!latestCommit.files.includes(filePath)) return null;

  const objectsPath = join(dir, VCS_DIR, OBJECTS_DIR);
  const commitDir = join(objectsPath, latestCommit.hash);
  const dataPath = join(commitDir, `${basename(filePath)}.json`);

  try {
    return await fs.readFile(dataPath, "utf-8");
  } catch {
    return null;
  }
}

export async function saveCommit(
  dir: string,
  hash: string,
  message: string,
  filePaths: string[],
  fileData: Map<string, string>
): Promise<Commit> {
  const commit: Commit = {
    hash,
    message,
    timestamp: new Date().toISOString(),
    files: filePaths,
  };

  const objectsPath = join(dir, VCS_DIR, OBJECTS_DIR);
  const commitDir = join(objectsPath, hash);
  await fs.mkdir(commitDir, { recursive: true });

  for (const [filePath, data] of fileData) {
    const dataPath = join(commitDir, `${basename(filePath)}.json`);
    await fs.writeFile(dataPath, data);
  }

  const logPath = join(dir, VCS_DIR, LOG_FILE);
  let commits: Commit[] = [];

  try {
    const logContent = await fs.readFile(logPath, "utf-8");
    commits = JSON.parse(logContent);
  } catch {
    await fs.writeFile(logPath, "[]");
  }

  commits.push(commit);
  await fs.writeFile(logPath, JSON.stringify(commits, null, 2));

  const headPath = join(dir, VCS_DIR, HEAD_FILE);
  await fs.writeFile(headPath, `ref: master\n${hash}`);

  return commit;
}

export async function getCommitLog(dir: string): Promise<Commit[]> {
  const logPath = join(dir, VCS_DIR, LOG_FILE);
  try {
    const logContent = await fs.readFile(logPath, "utf-8");
    return JSON.parse(logContent);
  } catch {
    return [];
  }
}
