import type { FixedModelSpec } from "../model-spec.js";
import type { ModelAttempt } from "./types.js";

export function createFixedModelAttempt(spec: FixedModelSpec): ModelAttempt {
  if (spec.transport === "cli") {
    return {
      transport: "cli",
      userModelId: spec.userModelId,
      llmModelId: null,
      cliProvider: spec.cliProvider,
      cliModel: spec.cliModel,
      openrouterProviders: null,
      forceOpenRouter: false,
      requiredEnv: spec.requiredEnv,
    };
  }
  if (spec.transport === "openrouter") {
    return {
      transport: "openrouter",
      userModelId: spec.userModelId,
      llmModelId: spec.llmModelId,
      openrouterProviders: spec.openrouterProviders,
      forceOpenRouter: true,
      requiredEnv: spec.requiredEnv,
      ...(spec.requestOptions ? { requestOptions: spec.requestOptions } : {}),
    };
  }
  return {
    transport: "native",
    userModelId: spec.userModelId,
    llmModelId: spec.llmModelId,
    openrouterProviders: spec.openrouterProviders,
    forceOpenRouter: false,
    requiredEnv: spec.requiredEnv,
    ...(spec.openaiBaseUrlOverride !== undefined
      ? { openaiBaseUrlOverride: spec.openaiBaseUrlOverride }
      : {}),
    ...(spec.forceChatCompletions !== undefined
      ? { forceChatCompletions: spec.forceChatCompletions }
      : {}),
    ...(spec.requestOptions ? { requestOptions: spec.requestOptions } : {}),
  };
}
