import OpenAI from "openai";
import { requireEnv } from "@/lib/env";

let openAiClient: OpenAI | null = null;

export function getOpenAiClient() {
  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  }

  return openAiClient;
}
