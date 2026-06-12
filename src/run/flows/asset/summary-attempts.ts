import path from "node:path";
import type { CliProvider } from "../../../config.js";
import { parseCliUserModelId } from "../../../engine/cli-model-id.js";
import { createFixedModelAttempt } from "../../../engine/fixed-model-attempt.js";
import type { ModelAttempt } from "../../../engine/types.js";
import { buildAutoModelAttempts } from "../../../model-auto.js";
import { buildPathSummaryPrompt } from "../../../prompts/index.js";
import { ensureCliAttachmentPath } from "../../attachments.js";
import type { AssetSummaryContext, SummarizeAssetArgs } from "./types.js";

export async function buildAssetModelAttempts({
  ctx,
  kind,
  promptTokensForAuto,
  requiresVideoUnderstanding,
  lastSuccessfulCliProvider,
}: {
  ctx: AssetSummaryContext;
  kind: "video" | "image" | "text" | "file";
  promptTokensForAuto: number | null;
  requiresVideoUnderstanding: boolean;
  lastSuccessfulCliProvider: CliProvider | null;
}): Promise<ModelAttempt[]> {
  if (ctx.isFallbackModel) {
    const catalog = await ctx.getLiteLlmCatalog();
    const all = buildAutoModelAttempts({
      kind,
      promptTokens: promptTokensForAuto,
      desiredOutputTokens: ctx.desiredOutputTokens,
      requiresVideoUnderstanding,
      env: ctx.envForAuto,
      config: ctx.configForModelSelection,
      catalog,
      openrouterProvidersFromEnv: null,
      cliAvailability: ctx.cliAvailability,
      isImplicitAutoSelection: ctx.isImplicitAutoSelection,
      allowAutoCliFallback: ctx.allowAutoCliFallback,
      lastSuccessfulCliProvider,
    });
    return all.map((attempt) => {
      if (attempt.transport !== "cli") {
        return ctx.summaryEngine.applyOpenAiGatewayOverrides(attempt as ModelAttempt);
      }
      const parsed = parseCliUserModelId(attempt.userModelId);
      return { ...attempt, cliProvider: parsed.provider, cliModel: parsed.model };
    });
  }

  /* v8 ignore next */
  if (!ctx.fixedModelSpec) {
    throw new Error("Internal error: missing fixed model spec");
  }
  const attempt = createFixedModelAttempt(ctx.fixedModelSpec);
  return [
    attempt.transport === "cli" ? attempt : ctx.summaryEngine.applyOpenAiGatewayOverrides(attempt),
  ];
}

export async function buildAssetCliContext({
  ctx,
  args,
  attempts,
  attachmentsCount,
  summaryLengthTarget,
}: {
  ctx: AssetSummaryContext;
  args: SummarizeAssetArgs;
  attempts: ModelAttempt[];
  attachmentsCount: number;
  summaryLengthTarget: import("@steipete/summarize-core").SummaryLength | { maxCharacters: number };
}) {
  if (!attempts.some((attempt) => attempt.transport === "cli")) return null;
  if (attachmentsCount === 0) return null;
  const needsPathPrompt = args.attachment.kind === "image" || args.attachment.kind === "file";
  if (!needsPathPrompt) return null;

  const filePath = await ensureCliAttachmentPath({
    sourceKind: args.sourceKind,
    sourceLabel: args.sourceLabel,
    attachment: args.attachment,
  });
  const dir = path.dirname(filePath);
  const extraArgsByProvider: Partial<Record<CliProvider, string[]>> = {
    gemini: ["--include-directories", dir],
    codex: args.attachment.kind === "image" ? ["-i", filePath] : undefined,
    opencode: ["--file", filePath],
  };

  return {
    promptOverride: buildPathSummaryPrompt({
      kindLabel: args.attachment.kind === "image" ? "image" : "file",
      filePath,
      filename: args.attachment.filename,
      mediaType: args.attachment.mediaType,
      summaryLength: summaryLengthTarget,
      outputLanguage: ctx.outputLanguage,
      promptOverride: ctx.promptOverride ?? null,
      lengthInstruction: ctx.lengthInstruction ?? null,
      languageInstruction: ctx.languageInstruction ?? null,
    }),
    allowTools: true,
    cwd: dir,
    extraArgsByProvider,
  };
}
