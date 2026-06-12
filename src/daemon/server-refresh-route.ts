import type http from "node:http";
import { Writable } from "node:stream";
import { refreshFree } from "../refresh-free.js";
import { json } from "./server-http.js";
import type { DaemonRuntime } from "./server-runtime.js";
import { createSession, endSession, pushToSession, type SessionEvent } from "./server-session.js";

function createLineWriter(onLine: (line: string) => void): Writable {
  let buffer = "";
  return new Writable({
    write(chunk, _encoding, callback) {
      buffer += chunk.toString();
      let index = buffer.indexOf("\n");
      while (index >= 0) {
        const line = buffer.slice(0, index).trimEnd();
        buffer = buffer.slice(index + 1);
        if (line.trim().length > 0) onLine(line);
        index = buffer.indexOf("\n");
      }
      callback();
    },
    final(callback) {
      const line = buffer.trim();
      if (line) onLine(line);
      buffer = "";
      callback();
    },
  });
}

export async function handleRefreshFreeRoute({
  req,
  res,
  pathname,
  cors,
  env,
  fetchImpl,
  runtime,
  createSessionId,
  onSessionEvent,
  cleanupDelayMs = 60_000,
}: {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  pathname: string;
  cors: Record<string, string>;
  env: Record<string, string | undefined>;
  fetchImpl: typeof fetch;
  runtime: DaemonRuntime;
  createSessionId: () => string;
  onSessionEvent?: ((event: SessionEvent, sessionId: string) => void) | null;
  cleanupDelayMs?: number;
}): Promise<boolean> {
  if (req.method !== "POST" || pathname !== "/v1/refresh-free") return false;

  if (runtime.activeRefreshSessionId) {
    json(res, 200, { ok: true, id: runtime.activeRefreshSessionId, running: true }, cors);
    return true;
  }

  const session = createSession(createSessionId);
  runtime.registerRefreshSession(session);
  json(res, 200, { ok: true, id: session.id }, cors);

  void (async () => {
    const pushStatus = (text: string) => {
      pushToSession(session, { event: "status", data: { text } }, onSessionEvent);
    };
    try {
      pushStatus("Refresh free: starting…");
      const stdout = createLineWriter(pushStatus);
      const stderr = createLineWriter(pushStatus);
      await refreshFree({ env, fetchImpl, stdout, stderr });
      pushToSession(session, { event: "done", data: {} }, onSessionEvent);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      pushToSession(session, { event: "error", data: { message } }, onSessionEvent);
      console.error("[summarize-daemon] refresh-free failed", error);
    } finally {
      runtime.finishRefreshSession(session.id);
      setTimeout(() => {
        runtime.refreshSessions.delete(session.id);
        endSession(session);
      }, cleanupDelayMs).unref();
    }
  })();
  return true;
}
