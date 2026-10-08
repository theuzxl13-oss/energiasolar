import type { ChatMessage } from "@/types";

export interface ChatReply {
  content: string;
  provider: string;
}

/** Contrato para provedores de chat (demonstração, Anthropic, outros). */
export interface ChatProvider {
  readonly name: string;
  reply(messages: ChatMessage[]): Promise<ChatReply>;
}
