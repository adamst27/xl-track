import { join } from "node:path";
import fs from "node:fs/promises";

export interface Commit {
  hash: string;
  message: string;
  timestamp: string;
  normalizedDataPath: string;
}

const VCS_DIR = ".xlvc";
const OBJECTS_DIR = "objects";
const HEAD_FILE = "HEAD";
const LOG_FILE = "log.json";

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

export async function getLatestNormalizedData(
  dir: string
): Promise<string | null> {
  const latestHash = await getLatestCommitHash(dir);
  if (!latestHash) return null;

  const objectsPath = join(dir, VCS_DIR, OBJECTS_DIR);
  const dataPath = join(objectsPath, `${latestHash}.json`);

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
  normalizedData: string
): Promise<Commit> {
  const commit: Commit = {
    hash,
    message,
    timestamp: new Date().toISOString(),
    normalizedDataPath: `${OBJECTS_DIR}/${hash}.json`,
  };

  const objectsPath = join(dir, VCS_DIR, OBJECTS_DIR);
  const dataPath = join(objectsPath, `${hash}.json`);

  await fs.writeFile(dataPath, normalizedData);

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
