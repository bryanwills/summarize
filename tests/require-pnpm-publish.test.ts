import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const script = resolve("scripts/require-pnpm-publish.mjs");
const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolveClose, reject) => {
          server.close((error) => (error ? reject(error) : resolveClose()));
        }),
    ),
  );
});

async function registryUrl(status: number, body: unknown): Promise<string> {
  const server = createServer((_request, response) => {
    response.writeHead(status, { "content-type": "application/json" });
    response.end(JSON.stringify(body));
  });
  servers.push(server);
  await new Promise<void>((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Registry test server did not bind");
  return `http://127.0.0.1:${address.port}/`;
}

function publishEnv(registry: string): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH,
    npm_config_registry: registry,
    npm_config_user_agent: "pnpm/10.34.5 npm/? node/v24",
    npm_execpath: "/tmp/pnpm.cjs",
  };
}

describe("pnpm publish guard", () => {
  it("allows the CLI only when its exact core version is visible", async () => {
    const rootPackage = await import("../package.json", { with: { type: "json" } });
    const registry = await registryUrl(200, { version: rootPackage.default.version });

    await expect(
      execFileAsync(process.execPath, [script], { cwd: resolve("."), env: publishEnv(registry) }),
    ).resolves.toMatchObject({ stderr: "" });
  });

  it("refuses the CLI when its exact core version is missing", async () => {
    const registry = await registryUrl(404, { error: "not_found" });

    await expect(
      execFileAsync(process.execPath, [script], { cwd: resolve("."), env: publishEnv(registry) }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("is not visible on npm"),
    });
  });

  it("allows the core package without querying itself", async () => {
    await expect(
      execFileAsync(process.execPath, [script], {
        cwd: resolve("packages/core"),
        env: publishEnv("http://127.0.0.1:1/"),
      }),
    ).resolves.toMatchObject({ stderr: "" });
  });
});
