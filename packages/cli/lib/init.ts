import { join } from "node:path";
import fs from "node:fs/promises";

// TODO:  Implement an initial state of the vc

export const init = async (dir: string) => {
  const target = join(dir, ".xlvc");

  try {
    await fs.access(target);
    console.log("Already initialized");
  } catch (err) {
    makeAbsentHeadFile(target);
  }
};

const makeAbsentHeadFile = async (target: string) => {
  try {
    const headFilePath = join(target, "HEAD");
    const objectsPath = join(target, "objects");
    await fs.mkdir(objectsPath, { recursive: true });
    await fs.writeFile(headFilePath, "ref: master");
  } catch (err) {
    await fs.rmdir(target);
    console.error(err);
  }
};
