import type { SummarizeConfig } from "../config.js";
import { createModelExecutor, type ModelExecutorDeps } from "../engine/model-executor.js";
import type { LengthArg } from "../flags.js";
import { resolveProviderRuntimeBindings } from "../run/provider-runtime.js";
import { resolveRunApiStatus } from "../run/run-api-status.js";
import type { RunContextState } from "../run/run-context.js";
import { createRunMetrics } from "../run/run-metrics.js";
import { resolveModelSelection } from "../run/run-models.js";
import { resolveDesiredOutputTokens } from "../run/run-output.js";

type ModelExecutorRequestOptions = Pick<
  ModelExecutorDeps,
  "openaiRequestOptions" | "openaiRequestOptionsOverride" | "cliReasoningEffortOverride"
>;

export function resolveRunModelSpec({
  context,
  envForRun,
  explicitModelArg,
  configForSelection,
  lengthArg,
  maxOutputTokensArg,
}: {
  context: RunContextState;
  envForRun: Record<string, string | undefined>;
  explicitModelArg: string | null;
  configForSelection: SummarizeConfig | null;
  lengthArg: LengthArg;
  maxOutputTokensArg: number | null;
}) {
  const selection = resolveModelSelection({
    config: context.config,
    configForCli: configForSelection,
    configPath: context.configPath,
    envForRun,
    explicitModelArg,
  });
  return {
    ...selection,
    fixedModelSpec: selection.requestedModel.kind === "fixed" ? selection.requestedModel : null,
    desiredOutputTokens: resolveDesiredOutputTokens({
      lengthArg,
      maxOutputTokensArg,
    }),
  };
}

export function createRunModelRuntime({
  context,
  env,
  envForRun,
  metricsEnv,
  fetchImpl,
  execFileImpl,
  maxOutputTokensArg,
  timeoutMs,
  retries,
  streamingEnabled,
  requestOptions = {},
  log,
  trace,
}: {
  context: RunContextState;
  env: Record<string, string | undefined>;
  envForRun: Record<string, string | undefined>;
  metricsEnv: Record<string, string | undefined>;
  fetchImpl: typeof fetch;
  execFileImpl: ModelExecutorDeps["execFileImpl"];
  maxOutputTokensArg: number | null;
  timeoutMs: number;
  retries: number;
  streamingEnabled: boolean;
  requestOptions?: ModelExecutorRequestOptions;
  log?: ModelExecutorDeps["log"];
  trace?: ModelExecutorDeps["trace"];
}) {
  const metrics = createRunMetrics({
    env: metricsEnv,
    fetchImpl,
    maxOutputTokensArg,
  });
  const apiStatus = resolveRunApiStatus(context);
  const providerRuntime = resolveProviderRuntimeBindings({
    env: envForRun,
    envState: context,
    configForCli: context.configForCli,
  });
  const summaryEngine = createModelExecutor({
    env,
    envForRun,
    execFileImpl,
    timeoutMs,
    retries,
    streamingEnabled,
    ...requestOptions,
    cliConfigForRun: context.cliConfigForRun ?? null,
    cliAvailability: context.cliAvailability,
    trackedFetch: metrics.trackedFetch,
    resolveMaxOutputTokensForCall: metrics.resolveMaxOutputTokensForCall,
    resolveMaxInputTokensForCall: metrics.resolveMaxInputTokensForCall,
    llmCalls: metrics.llmCalls,
    log,
    trace,
    providerRuntime,
    openrouterApiKey: apiStatus.openrouterApiKey,
  });

  return {
    metrics,
    apiStatus,
    summaryEngine,
  };
}
