import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

/** Server-only Anthropic client, authenticated with CLAUDE_API_KEY. */
export function getClaudeClient() {
  if (!client) {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error("CLAUDE_API_KEY is not set.");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}
