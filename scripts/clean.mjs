import { rm } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

const cwd = process.cwd();
const targets = process.argv.slice(2);

if (targets.length === 0) {
  throw new Error("clean requires at least one target");
}

for (const target of targets) {
  const resolved = resolve(cwd, target);
  const relativeTarget = relative(cwd, resolved);
  if (
    !relativeTarget ||
    relativeTarget === ".." ||
    relativeTarget.startsWith(`..${sep}`) ||
    isAbsolute(relativeTarget)
  ) {
    throw new Error(`clean target must stay below the current directory: ${target}`);
  }
  await rm(resolved, { force: true, recursive: true });
}
