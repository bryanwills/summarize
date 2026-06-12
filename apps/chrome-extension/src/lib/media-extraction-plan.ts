import { isYouTubeVideoUrl, shouldPreferUrlMode } from "@steipete/summarize-core/content/url";

export type MediaInputMode = "page" | "video";

export function planMediaExtraction({
  url,
  requestedInputMode,
}: {
  url: string;
  requestedInputMode?: MediaInputMode | null;
}) {
  const isYouTubeVideo = isYouTubeVideoUrl(url);
  const prefersUrlMode = shouldPreferUrlMode(url);
  const inputMode = requestedInputMode ?? (prefersUrlMode ? "video" : null);

  return {
    contentScriptInputMode: prefersUrlMode
      ? (requestedInputMode ?? "video")
      : (requestedInputMode ?? undefined),
    directYouTubeTranscript: isYouTubeVideo && requestedInputMode !== "page" && prefersUrlMode,
    inputMode,
    isYouTubeVideo,
    localTranscriptKind: isYouTubeVideo
      ? ("youtube" as const)
      : requestedInputMode === "video" || prefersUrlMode
        ? ("media" as const)
        : null,
    prefersUrlMode,
  };
}
