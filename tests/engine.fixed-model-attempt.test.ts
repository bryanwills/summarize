import { describe, expect, it } from "vitest";
import { createFixedModelAttempt } from "../src/engine/fixed-model-attempt.js";
import { parseRequestedModelId } from "../src/model-spec.js";

function fixedModel(modelId: string) {
  const requested = parseRequestedModelId(modelId);
  if (requested.kind !== "fixed") throw new Error(`expected fixed model: ${modelId}`);
  return requested;
}

describe("fixed model attempt materialization", () => {
  it("materializes native provider settings", () => {
    expect(createFixedModelAttempt(fixedModel("minimax/MiniMax-M3"))).toMatchObject({
      transport: "native",
      userModelId: "minimax/MiniMax-M3",
      llmModelId: "minimax/MiniMax-M3",
      requiredEnv: "MINIMAX_API_KEY",
      openaiBaseUrlOverride: "https://api.minimax.io/v1",
      forceChatCompletions: true,
    });
  });

  it("materializes OpenRouter settings", () => {
    expect(createFixedModelAttempt(fixedModel("openrouter/openai/gpt-5-mini"))).toEqual({
      transport: "openrouter",
      userModelId: "openrouter/openai/gpt-5-mini",
      llmModelId: "openai/openai/gpt-5-mini",
      openrouterProviders: null,
      forceOpenRouter: true,
      requiredEnv: "OPENROUTER_API_KEY",
    });
  });

  it("materializes CLI settings", () => {
    expect(createFixedModelAttempt(fixedModel("cli/codex/gpt-5.4"))).toEqual({
      transport: "cli",
      userModelId: "cli/codex/gpt-5.4",
      llmModelId: null,
      cliProvider: "codex",
      cliModel: "gpt-5.4",
      openrouterProviders: null,
      forceOpenRouter: false,
      requiredEnv: "CLI_CODEX",
    });
  });
});
