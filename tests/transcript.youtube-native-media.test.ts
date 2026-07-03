import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  extractYoutubePlayerBootstrap: vi.fn(),
  resolveYoutubeAudio: vi.fn(),
  transcribeMediaUrl: vi.fn(),
}));

vi.mock("../packages/core/src/content/youtube.js", () => ({
  extractYoutubePlayerBootstrap: mocks.extractYoutubePlayerBootstrap,
  resolveYoutubeAudio: mocks.resolveYoutubeAudio,
}));

vi.mock("../packages/core/src/content/transcript/providers/podcast/media.js", () => ({
  transcribeMediaUrl: mocks.transcribeMediaUrl,
}));

import { tryNativeYoutubeMediaTranscript } from "../packages/core/src/content/transcript/providers/youtube/native-media.js";
import type { YouTubeProviderFlow } from "../packages/core/src/content/transcript/providers/youtube/provider-flow.js";

describe("YouTube native media transcript", () => {
  it("preserves Deepgram timestamp segments", async () => {
    mocks.extractYoutubePlayerBootstrap.mockReturnValue({
      apiKey: "YOUTUBE",
      visitorData: "VISITOR",
    });
    mocks.resolveYoutubeAudio.mockResolvedValue({
      url: "https://example.com/audio.mp3",
      filename: "audio.mp3",
      durationSeconds: 12,
      resolver: "android-vr",
    });
    mocks.transcribeMediaUrl.mockResolvedValue({
      text: "Native audio transcript",
      provider: "deepgram",
      error: null,
      segments: [{ startMs: 500, endMs: 1750, text: "Native audio transcript" }],
    });

    const result = await tryNativeYoutubeMediaTranscript({
      canTranscribe: true,
      effectiveVideoId: "abcdefghijk",
      htmlText: "<html>ytInitialPlayerResponse</html>",
      context: {
        url: "https://www.youtube.com/watch?v=abcdefghijk",
        html: "<html>ytInitialPlayerResponse</html>",
        resourceKey: "abcdefghijk",
      },
      options: {
        fetch: vi.fn() as unknown as typeof fetch,
        apifyApiToken: null,
        youtubeTranscriptMode: "auto",
        mediaTranscriptMode: "auto",
        transcriptTimestamps: true,
        ytDlpPath: null,
      },
      transcription: {},
      attemptedProviders: [],
      notes: [],
      durationMetadata: {},
      canRunYtDlp: false,
      pushHint: vi.fn(),
    } as YouTubeProviderFlow);

    expect(result?.text).toBe("Native audio transcript");
    expect(result?.segments).toEqual([
      { startMs: 500, endMs: 1750, text: "Native audio transcript" },
    ]);
    expect(result?.metadata?.transcriptionProvider).toBe("deepgram");
  });
});
