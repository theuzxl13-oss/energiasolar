import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatProvider } from "./chat-provider";
import { buildSystemPrompt, FALLBACK_ANSWER } from "./knowledge-base";

/**
 * Provedor Claude (Anthropic). A chave é lida de AI_API_KEY no servidor
 * e nunca é enviada ao navegador.
 */
export function createAnthropicChatProvider(apiKey: string, model: string): ChatProvider {
  const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 30_000 });
  const system = buildSystemPrompt();

  return {
    name: "anthropic",

    async reply(messages) {
      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        // Chat de atendimento: respostas curtas e rápidas.
        output_config: { effort: "low" },
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: messages.map((message) => ({ role: message.role, content: message.content })),
      });

      if (response.stop_reason === "refusal") {
        return { content: FALLBACK_ANSWER, provider: this.name };
      }

      const text = response.content
        .flatMap((block) => (block.type === "text" ? [block.text] : []))
        .join("\n")
        .trim();

      return { content: text || FALLBACK_ANSWER, provider: this.name };
    },
  };
}
