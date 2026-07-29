#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const userAgent = process.env.npm_config_user_agent || "";
const execPath = process.env.npm_execpath || "";

if (!userAgent.includes("pnpm/") && !execPath.includes("pnpm")) {
  console.error(
    "Refusing to publish with npm: use pnpm publish so workspace:* deps are rewritten.",
  );
  process.exit(1);
}

const packageJson = JSON.parse(await readFile(resolve("package.json"), "utf8"));
if (packageJson.name !== "@steipete/summarize") {
  process.exit(0);
}

const corePackageJson = JSON.parse(await readFile(resolve("packages/core/package.json"), "utf8"));
if (packageJson.version !== corePackageJson.version) {
  console.error(
    `Refusing to publish ${packageJson.name}@${packageJson.version}: local core version is ${corePackageJson.version}.`,
  );
  process.exit(1);
}

const registry = process.env.npm_config_registry || "https://registry.npmjs.org/";
const coreName = corePackageJson.name;
const coreVersion = corePackageJson.version;
const packageUrl = new URL(
  `${encodeURIComponent(coreName)}/${encodeURIComponent(coreVersion)}`,
  registry.endsWith("/") ? registry : `${registry}/`,
);

let response;
try {
  response = await fetch(packageUrl, { headers: { accept: "application/json" } });
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(
    `Refusing to publish ${packageJson.name}@${packageJson.version}: could not verify ${coreName}@${coreVersion} on npm (${reason}).`,
  );
  process.exit(1);
}

if (!response.ok) {
  console.error(
    `Refusing to publish ${packageJson.name}@${packageJson.version}: ${coreName}@${coreVersion} is not visible on npm.`,
  );
  process.exit(1);
}

const publishedCore = await response.json();
if (publishedCore.version !== coreVersion) {
  console.error(
    `Refusing to publish ${packageJson.name}@${packageJson.version}: npm returned invalid metadata for ${coreName}@${coreVersion}.`,
  );
  process.exit(1);
}
