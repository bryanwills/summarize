import { describe, expect, it } from "vitest";
import {
  buildLinkSummaryPrompt,
  SUMMARY_LENGTH_TO_TOKENS,
} from "../packages/core/src/prompts/index.js";

describe("buildLinkSummaryPrompt", () => {
  it("includes share guidance when no shares provided", () => {
    const prompt = buildLinkSummaryPrompt({
      url: "https://example.com",
      title: "Hello",
      siteName: "Example",
      description: "Desc",
      content: "Body",
      truncated: false,
      hasTranscript: false,
      outputLanguage: { kind: "fixed", tag: "en", label: "English" },
      summaryLength: "short",
      shares: [],
    });

    expect(prompt).toContain("<instructions>");
    expect(prompt).toContain("<context>");
    expect(prompt).toContain("<content>");
    expect(prompt).toContain("Write the answer in English.");
    expect(prompt).toContain("Source URL: https://example.com");
    expect(prompt).toContain("Page name: Hello");
    expect(prompt).toContain("Site: Example");
    expect(prompt).toContain("Page description: Desc");
    expect(prompt).toContain("Extracted content length: 4 characters");
    expect(prompt).toContain("Target length: around 900 characters");
    expect(prompt).toContain("You are not given any quotes from people who shared this link.");
    expect(prompt).not.toContain("Tweets from sharers:");
  });

  it("adds source-aware, scannable Markdown guidance", () => {
    const prompt = buildLinkSummaryPrompt({
      url: "https://news.ycombinator.com/item?id=123",
      title: "Discussion",
      siteName: "Hacker News",
      description: null,
      content: "Article and comments",
      truncated: false,
      hasTranscript: false,
      outputLanguage: { kind: "fixed", tag: "en", label: "English" },
      summaryLength: "long",
      shares: [],
    });

    expect(prompt).toContain(
      "You summarize web pages, including articles, posts, and discussion threads",
    );
    expect(prompt).toContain("For an article or transcript, lead with the central claim");
    expect(prompt).toContain("For a discussion or comment thread, synthesize the main viewpoints");
    expect(prompt).toContain("areas of agreement, disagreement, evidence, and caveats");
    expect(prompt).toContain(
      "Do not recap comments one by one or organize the summary around usernames",
    );
    expect(prompt).toContain("Lead with a concise overview");
    expect(prompt).toContain(
      'descriptive Markdown headings using the "### " prefix and/or short bullet lists',
    );
    expect(prompt).toContain("never put a multi-point summary in one uninterrupted paragraph");
    expect(prompt).toContain("For a short or simple source, do not force headings or lists");
    expect(prompt).toContain("Use one blank line between Markdown blocks");
    expect(prompt).toContain(
      "Keep list items on consecutive lines with no blank lines between them",
    );
    expect(prompt).not.toContain("Keep the response compact by avoiding blank lines");
  });

  it("adds a soft target when summary length is specified in characters", () => {
    const prompt = buildLinkSummaryPrompt({
      url: "https://example.com",
      title: null,
      siteName: null,
      description: null,
      content: "Body",
      truncated: false,
      hasTranscript: false,
      outputLanguage: { kind: "fixed", tag: "en", label: "English" },
      summaryLength: { maxCharacters: 20_000 },
      shares: [],
    });

    expect(prompt).toContain("<instructions>");
    expect(prompt).toContain("Target length: up to 4 characters total");
    expect(prompt).toContain("Extracted content length: 4 characters");
  });

  it("renders sharer lines with metrics and timestamp", () => {
    const prompt = buildLinkSummaryPrompt({
      url: "https://example.com",
      title: null,
      siteName: null,
      description: null,
      content: "Body",
      truncated: true,
      hasTranscript: true,
      outputLanguage: { kind: "fixed", tag: "de", label: "German" },
      summaryLength: "xl",
      shares: [
        {
          author: "Peter",
          handle: "steipete",
          text: "Worth reading",
          likeCount: 1200,
          reshareCount: 45,
          replyCount: 2,
          timestamp: "2025-12-17",
        },
      ],
    });

    expect(prompt).toContain("<context>");
    expect(prompt).toContain("Write the answer in German.");
    expect(prompt).toContain("Note: Content truncated");
    expect(prompt).toContain("Tweets from sharers:");
    expect(prompt).toContain(
      "- @steipete (2025-12-17) [1,200 likes, 45 reshares, 2 replies]: Worth reading",
    );
    expect(prompt).toContain('append a brief subsection titled "What sharers are saying"');
    expect(prompt).toContain("Use 2-5 short paragraphs.");
    expect(prompt).toContain("Make multi-point summaries easy to scan");
  });

  it("keeps token map stable", () => {
    expect(SUMMARY_LENGTH_TO_TOKENS).toEqual({
      short: 768,
      medium: 1536,
      long: 3072,
      xl: 6144,
      xxl: 12288,
    });
  });

  it("adds heading guidance for large summaries", () => {
    const prompt = buildLinkSummaryPrompt({
      url: "https://example.com",
      title: null,
      siteName: null,
      description: null,
      content: "x".repeat(12_000),
      truncated: false,
      hasTranscript: false,
      outputLanguage: { kind: "fixed", tag: "en", label: "English" },
      summaryLength: { maxCharacters: 10_000 },
      shares: [],
    });

    expect(prompt).toContain('Use Markdown headings with the "### " prefix');
    expect(prompt).toContain("Include at least 3 headings");
    expect(prompt).toContain("start with a heading");
  });

  it("adds timestamp guidance when transcript timestamps are available", () => {
    const prompt = buildLinkSummaryPrompt({
      url: "https://example.com/video",
      title: "Video",
      siteName: "YouTube",
      description: null,
      content: "Transcript:\n[0:01] Hello",
      truncated: false,
      hasTranscript: true,
      hasTranscriptTimestamps: true,
      outputLanguage: { kind: "fixed", tag: "en", label: "English" },
      summaryLength: "short",
      shares: [],
    });

    expect(prompt).toContain("Mandatory timestamp section");
    expect(prompt).toContain("Key moments");
    expect(prompt).toContain("Start each bullet with a [mm:ss]");
  });
});
