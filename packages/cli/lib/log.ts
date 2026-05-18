import { getCommitLog } from "./storage";
import type { Commit } from "./storage";

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m",
};

function colorize(text: string, color: string): string {
  return `${color}${text}${COLORS.reset}`;
}

export async function log(dir: string): Promise<string> {
  const commits: Commit[] = await getCommitLog(dir);

  if (commits.length === 0) {
    return "No commits yet.";
  }

  const lines: string[] = [];
  lines.push(colorize("Commit History", COLORS.bold));
  lines.push(colorize("═".repeat(50), COLORS.gray));

  for (let i = commits.length - 1; i >= 0; i--) {
    const c = commits[i];
    if (!c) continue;
    const shortHash = c.hash.slice(0, 12);
    lines.push(``);
    lines.push(colorize(`  ${shortHash}`, COLORS.cyan));
    lines.push(`  ${c.message}`);
    lines.push(colorize(`  ${c.timestamp}`, COLORS.gray));
  }

  return lines.join("\n");
}
