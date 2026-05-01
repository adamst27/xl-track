import fs from "node:fs/promises";
import { join } from "node:path";
import { init } from "./lib/init";

// todo: handle the case where argv[2] is not our command
const initialEntry = process.argv[2];

switch (initialEntry) {
  case "init": {
    init(process.cwd());
    break;
  }
  default: {
    console.error("ERR: Not valid arg");
  }
}
