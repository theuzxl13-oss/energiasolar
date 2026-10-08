import "server-only";
import { serverEnv } from "@/lib/env";
import { createAnthropicChatProvider } from "./anthropic-provider";
import type { ChatProvider } from "./chat-provider";
import { demoChatProvider } from "./demo-provider";

/**
 * Seleciona o provedor de chat. Sem AI_API_KEY, usa o modo demonstrativo.
 * Para adicionar outro provedor, implemente `ChatProvider` e inclua um
 * novo `case` com o valor de AI_PROVIDER correspondente.
 */
export function getChatProvider(): ChatProvider {
  const { aiApiKey, aiModel, aiProvider } = serverEnv();
  if (!aiApiKey) return demoChatProvider;

  switch (aiProvider) {
    case "anthropic":
      return createAnthropicChatProvider(aiApiKey, aiModel);
    default:
      return demoChatProvider;
  }
}

export { demoChatProvider };
export type { ChatProvider, ChatReply } from "./chat-provider";
