import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const applicationDir = join(process.cwd(), "src", "application");

describe("application import boundary", () => {
  it("does not depend on daemon or TTY modules", () => {
    const forbiddenImports: string[] = [];
    for (const name of readdirSync(applicationDir).filter((entry) => entry.endsWith(".ts"))) {
      const source = readFileSync(join(applicationDir, name), "utf8");
      for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
        const specifier = match[1] ?? "";
        if (specifier.startsWith("../daemon/") || specifier.startsWith("../tty/")) {
          forbiddenImports.push(`${name}: ${specifier}`);
        }
      }
    }

    expect(forbiddenImports).toEqual([]);
  });
});
