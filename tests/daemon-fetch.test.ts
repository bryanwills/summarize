import { describe, expect, it, vi } from "vitest";
import {
  connectNativeOrReload,
  NATIVE_MESSAGING_HOST_NAME,
} from "../apps/chrome-extension/src/lib/daemon-fetch";

describe("connectNativeOrReload", () => {
  it("reloads a stale extension context and asks the caller to retry", () => {
    const reload = vi.fn();

    expect(() =>
      connectNativeOrReload({ connectNative: undefined, reload }, NATIVE_MESSAGING_HOST_NAME),
    ).toThrow("Local companion enabled — extension reloaded; reopen it and retry");
    expect(reload).toHaveBeenCalledOnce();
  });

  it("opens the native host when the API is available", () => {
    const port = {} as chrome.runtime.Port;
    const connectNative = vi.fn(() => port);
    const reload = vi.fn();

    expect(connectNativeOrReload({ connectNative, reload }, NATIVE_MESSAGING_HOST_NAME)).toBe(port);
    expect(connectNative).toHaveBeenCalledWith(NATIVE_MESSAGING_HOST_NAME);
    expect(reload).not.toHaveBeenCalled();
  });
});
