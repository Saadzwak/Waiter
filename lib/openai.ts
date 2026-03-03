import OpenAI from "openai";

// Singleton — reused across server-side calls
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const MODELS = {
  chat: "gpt-4o",
  embedding: "text-embedding-3-small",
  vision: "gpt-4o",
} as const;
