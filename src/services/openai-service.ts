import OpenAI from "openai";
import { getEnv, requireEnv } from "@/lib/env";

let openAiClient: OpenAI | null = null;

export function getOpenAiClient() {
  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  }

  return openAiClient;
}

export async function generateTextWithOpenAI(prompt: string) {
  const env = getEnv();
  const response = await getOpenAiClient().responses.create({
    model: env.OPENAI_MODEL,
    input: prompt,
  });

  return response.output_text;
}
