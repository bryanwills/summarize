import type http from "node:http";
import { encodeSseEvent, type SseEvent } from "@steipete/summarize-core/runtime";

export type BufferedSseChannel = {
  buffer: Array<{ event: SseEvent; bytes: number }>;
  bufferBytes: number;
  clients: Set<http.ServerResponse>;
  done: boolean;
};

const MAX_BUFFER_BYTES = 1_000_000;

export function createBufferedSseChannel(): BufferedSseChannel {
  return {
    buffer: [],
    bufferBytes: 0,
    clients: new Set(),
    done: false,
  };
}

export function pushBufferedSseEvent(channel: BufferedSseChannel, event: SseEvent) {
  const encoded = encodeSseEvent(event);
  const entry = { event, bytes: Buffer.byteLength(encoded) };
  channel.buffer.push(entry);
  channel.bufferBytes += entry.bytes;

  while (channel.bufferBytes > MAX_BUFFER_BYTES && channel.buffer.length > 0) {
    const removed = channel.buffer.shift();
    if (!removed) break;
    channel.bufferBytes -= removed.bytes;
  }

  for (const client of Array.from(channel.clients)) client.write(encoded);
}

export function closeBufferedSseChannel(channel: BufferedSseChannel) {
  for (const client of Array.from(channel.clients)) client.end();
  channel.clients.clear();
}
