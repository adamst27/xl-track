import { checkInitialized, init } from "./lib/init";
import { status, statusAll } from "./lib/status";
import { commit, commitAll } from "./lib/commit";
import { diff, diffAll } from "./lib/diff";
import { log } from "./lib/log";
import { handleAdd } from "./lib/add";
import { getTrackedFiles } from "./lib/storage";

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

function printUsage() {
  console.log(`
Usage: xlgit <command> [options]

Commands:
  init                      Initialize a new xlgit repository
  add <file>                Add a file to tracking
  status [file]             Check status of tracked files (or a specific file)
  commit [-m "message"]     Commit tracked files (requires -m)
  diff [file]               Show changes in tracked files (or a specific file)
  log                       Show commit history

Examples:
  xlgit init
  xlgit add data.xlsx
  xlgit status
  xlgit status data.xlsx
  xlgit commit -m "Initial commit"
  xlgit diff
  xlgit diff data.xlsx
  xlgit log
`);
}

function parseArgs(args: string[]) {
  const command = args[0];
  const noFileCommands = ["init", "log"];

  let filePath: string | undefined;
  let message: string | undefined;

  const messageIndex = args.findIndex((arg) => arg === "-m");
  if (messageIndex !== -1 && messageIndex + 1 < args.length) {
    message = args[messageIndex + 1];
  }

  if (command && !noFileCommands.includes(command)) {
    filePath = args.find(
      (arg, i) =>
        i > 0 &&
        !arg.startsWith("-") &&
        !["init", "status", "commit", "diff", "log", "add"].includes(arg) &&
        !(messageIndex !== -1 && i === messageIndex + 1),
    );
  }

  return { command, filePath, message };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    return;
  }

  const { command, filePath, message } = parseArgs(args);

  if (!command) {
    console.error(
      "Error: Please enter a command, use --help for the list of available commands!",
    );
    process.exit(1);
  }

  const cwd = process.cwd();

  const requiresInit = ["add", "status", "commit", "diff", "log"];

  if (requiresInit.includes(command)) {
    const isXlvcRepo = await checkInitialized(cwd);

    if (!isXlvcRepo) {
      console.error("Error: xlgit repo not initialized.");
      process.exit(1);
    }
  }

  const trackedFiles = await getTrackedFiles(cwd);

  switch (command) {
    case "init": {
      await init(cwd);
      console.log("Initialized xlgit repository.");
      break;
    }

    case "add": {
      if (!filePath) {
        console.error("Error: Please specify a file to add.");
        console.error("Usage: xlgit add <file>");
        process.exit(1);
      }
      const tracked = await handleAdd(cwd, filePath);
      console.log(`Added: ${filePath}`);
      console.log(`Tracked files: ${tracked.length}`);
      break;
    }

    case "status": {
      if (filePath && trackedFiles.length <= 1) {
        const result = await status(cwd, filePath);
        console.log(`${filePath}:`);
        console.log(`  Hash: ${result.currentHash.slice(0, 12)}...`);

        if (!result.isCommitted) {
          console.log(colorize("  Status: Not committed", COLORS.yellow));
        } else if (result.isModified) {
          console.log(colorize("  Status: Modified", COLORS.red));
        } else {
          console.log(colorize("  Status: Up to date", COLORS.green));
        }
      } else {
        const results = await statusAll(cwd);

        if (results.length === 0) {
          console.log("No tracked files. Run 'xlgit add <file>' first.");
          break;
        }

        let hasChanges = false;
        for (const result of results) {
          let statusStr = "";
          let statusColor = "";

          if (!result.isCommitted) {
            statusStr = "Not committed";
            statusColor = COLORS.yellow;
          } else if (result.isModified) {
            statusStr = "Modified";
            statusColor = COLORS.red;
            hasChanges = true;
          } else {
            statusStr = "Up to date";
            statusColor = COLORS.green;
          }

          console.log(`  ${colorize(statusStr, statusColor)}  ${result.file}`);
        }

        if (!hasChanges) {
          console.log("\nAll tracked files are up to date.");
        }
      }
      break;
    }

    case "commit": {
      if (!message) {
        console.error("Error: Please provide a commit message with -m");
        process.exit(1);
      }

      let commitResult;
      if (filePath && trackedFiles.length <= 1) {
        commitResult = await commit(cwd, filePath, message);
        console.log(
          `Committed: ${colorize(commitResult.hash.slice(0, 12), COLORS.cyan)}... "${commitResult.message}"`,
        );
      } else {
        commitResult = await commitAll(cwd, message);
        console.log(
          `Committed: ${colorize(commitResult.hash.slice(0, 12), COLORS.cyan)}... "${commitResult.message}"`,
        );
        console.log(`  Files: ${commitResult.files.length}`);
      }
      break;
    }

    case "diff": {
      if (filePath && trackedFiles.length < 1) {
        const diffResult = await diff(cwd, filePath);
        console.log(diffResult);
      } else {
        const diffResult = await diffAll(cwd);
        console.log(diffResult);
      }
      break;
    }

    case "log": {
      const logResult = await log(cwd);
      console.log(logResult);
      break;
    }

    default: {
      console.error(`Unknown command: ${command}`);
      printUsage();
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
