import { describe, expect, it } from "vitest";
import { createCachedExtract } from "../apps/chrome-extension/src/entrypoints/background/cached-extract.js";

describe("chrome cached extract", () => {
  it("builds page defaults and content metrics", () => {
    expect(
      createCachedExtract({
        extracted: {
          url: "https://example.com/article",
          title: null,
          text: "One two\nthree",
          truncated: false,
          media: null,
        },
        title: "Article",
      }),
    ).toEqual({
      url: "https://example.com/article",
      title: "Article",
      text: "One two\nthree",
      source: "page",
      truncated: false,
      totalCharacters: 13,
      wordCount: 3,
      media: null,
      transcriptSource: null,
      transcriptionProvider: null,
      transcriptCharacters: null,
      transcriptWordCount: null,
      transcriptLines: null,
      transcriptTimedText: null,
      mediaDurationSeconds: null,
      slides: null,
      diagnostics: null,
    });
  });

  it("builds transcript metrics while preserving explicit cache metadata", () => {
    const slides = { slides: [], generatedAt: "2026-06-12T00:00:00.000Z" };
    const diagnostics = { strategy: "browser" };

    expect(
      createCachedExtract({
        extracted: {
          url: "https://example.com/video",
          title: "Video",
          text: "Transcript content",
          truncated: true,
          mediaDurationSeconds: 42,
          media: { hasVideo: true, hasAudio: true, hasCaptions: false },
        },
        source: "url",
        diagnostics,
        title: null,
        transcript: {
          timedText: "[0:00] First\r\n[0:01] Second",
          text: "First Second",
          source: "browser",
          provider: "browser",
        },
        slides,
        wordCount: null,
      }),
    ).toMatchObject({
      source: "url",
      wordCount: null,
      transcriptSource: "browser",
      transcriptionProvider: "browser",
      transcriptCharacters: 12,
      transcriptWordCount: 2,
      transcriptLines: 2,
      transcriptTimedText: "[0:00] First\r\n[0:01] Second",
      mediaDurationSeconds: 42,
      slides,
      diagnostics,
    });
  });
});
