import { init } from "./lib/init";
import { status } from "./lib/status";
import { commit } from "./lib/commit";
import { diff } from "./lib/diff";
import { log } from "./lib/log";

function printUsage() {
  console.log(`
Usage: xl-track <command> [options]

Commands:
  init                  Initialize a new xl-track repository
  status <file.xlsx>    Check if file has been modified since last commit
  commit <file.xlsx> -m "message"  Commit the current state of the file
  diff <file.xlsx>      Show changes since last commit
  log                   Show commit history

Examples:
  xl-track init
  xl-track status data.xlsx
  xl-track commit data.xlsx -m "Initial commit"
  xl-track diff data.xlsx
  xl-track log
`);
}

function parseArgs(args: string[]) {
  const command = args[0];
  const filePath = args.find(
    (arg, i) =>
      i > 0 &&
      !arg.startsWith("-") &&
      !["init", "status", "commit", "diff", "log"].includes(arg)
  );
  const message = args.findIndex((arg) => arg === "-m") !== -1
    ? args[args.findIndex((arg) => arg === "-m") + 1]
    : undefined;

  return { command, filePath, message };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    return;
  }

  const { command, filePath, message } = parseArgs(args);
  const cwd = process.cwd();

  switch (command) {
    case "init": {
      await init(cwd);
      console.log("Initialized xl-track repository.");
      break;
    }

    case "status": {
      if (!filePath) {
        console.error("Error: Please specify an Excel file.");
        console.error("Usage: xl-track status <file.xlsx>");
        process.exit(1);
      }
      const result = await status(cwd, filePath);
      console.log(`Current hash: ${result.currentHash.slice(0, 12)}...`);

      if (!result.isCommitted) {
        console.log("Status: No commits yet.");
      } else if (result.isModified) {
        console.log("Status: Modified (changes detected)");
      } else {
        console.log("Status: Up to date");
      }
      break;
    }

    case "commit": {
      if (!filePath) {
        console.error("Error: Please specify an Excel file.");
        console.error("Usage: xl-track commit <file.xlsx> -m \"message\"");
        process.exit(1);
      }
      if (!message) {
        console.error("Error: Please provide a commit message with -m");
        process.exit(1);
      }
      const commitResult = await commit(cwd, filePath, message);
      console.log(
        `Committed: ${commitResult.hash.slice(0, 12)}... "${commitResult.message}"`
      );
      break;
    }

    case "diff": {
      if (!filePath) {
        console.error("Error: Please specify an Excel file.");
        console.error("Usage: xl-track diff <file.xlsx>");
        process.exit(1);
      }
      const diffResult = await diff(cwd, filePath);
      console.log(diffResult);
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
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
