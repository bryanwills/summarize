import { describe, expect, it } from "vitest";
import { createRequiredRuntimeReference } from "../apps/chrome-extension/src/entrypoints/sidepanel/runtime-reference.js";

describe("sidepanel runtime reference", () => {
  it("returns the initialized runtime", () => {
    const reference = createRequiredRuntimeReference<{ value: number }>("slides");
    const runtime = { value: 42 };

    reference.set(runtime);

    expect(reference.get()).toBe(runtime);
  });

  it("fails fast when read before initialization", () => {
    const reference = createRequiredRuntimeReference("summary");

    expect(() => reference.get()).toThrow("summary runtime is not initialized");
  });

  it("rejects replacement runtimes", () => {
    const reference = createRequiredRuntimeReference("chat");
    reference.set({ value: 1 });

    expect(() => reference.set({ value: 2 })).toThrow("chat runtime is already initialized");
  });
});
