import { describe, expect, it } from "vitest";
import { buildLinkSummaryPrompt } from "../packages/core/src/prompts/index.js";

describe("buildLinkSummaryPrompt (slides)", () => {
  it("adds slide timeline guidance with overview paragraph first", () => {
    const prompt = buildLinkSummaryPrompt({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Test",
      siteName: "YouTube",
      description: null,
      content: "Transcript:\n[0:01] Hello",
      truncated: false,
      hasTranscript: true,
      hasTranscriptTimestamps: true,
      slides: { count: 8, text: "Slide 1 [0:00–0:30]:\nHello" },
      outputLanguage: { kind: "fixed", tag: "en", label: "English" },
      summaryLength: "short",
      shares: [],
    });

    expect(prompt).toContain(
      "Slide format example (follow this pattern; markers on their own lines):",
    );
    expect(prompt).toContain("Required markers (use each exactly once, in order)");
    expect(prompt).toContain("Repeat the 3-line slide block for every marker below, in order.");
    expect(prompt).toContain('Every slide must include a headline line that starts with "## ".');
    expect(prompt).toContain("If there is no obvious title, create a short 2-6 word headline");
    expect(prompt).toContain('Never output "Title:" or "Slide 1/10".');
    expect(prompt).toContain('add exactly "## Interlude" with no body');
    expect(prompt).not.toContain("leave that slide marker with no text");
    expect(prompt).toContain("Do not create a dedicated Slides section or list");
    expect(prompt).toContain("Keep the response compact by avoiding blank lines");
    expect(prompt).not.toContain("For a discussion or comment thread");
    expect(prompt).not.toContain("Make multi-point summaries easy to scan");
    expect(prompt).not.toContain("Use one blank line between Markdown blocks");
    expect(prompt).not.toContain("Include at least 3 headings");
  });
});
