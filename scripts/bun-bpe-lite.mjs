import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import tokenizerModule from "../node_modules/bpe-lite/src/tokenizer.js";
import vocabPath from "../node_modules/bpe-lite/vocabs/openai-o200k.json.gz" with { type: "file" };

const { Tokenizer } = tokenizerModule;
let tokenizer;

function loadTokenizer() {
  if (!tokenizer) {
    const data = JSON.parse(gunzipSync(readFileSync(vocabPath)).toString("utf8"));
    tokenizer = new Tokenizer(data);
  }
  return tokenizer;
}

export function countTokens(text, provider = "openai-o200k") {
  if (provider !== "openai-o200k") {
    throw new Error(`Unsupported bundled tokenizer provider: ${provider}`);
  }
  return loadTokenizer().count(text);
}
