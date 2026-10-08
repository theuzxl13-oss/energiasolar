import type { ChatProvider } from "./chat-provider";
import { FALLBACK_ANSWER, GREETING_ANSWER, knowledgeBase } from "./knowledge-base";

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Provedor demonstrativo: busca por palavras-chave na base de conhecimento.
 * Não depende de serviços externos nem de chaves de API.
 */
export const demoChatProvider: ChatProvider = {
  name: "demo",

  async reply(messages) {
    const last = messages[messages.length - 1]?.content ?? "";
    const text = normalize(last);

    if (/^(oi|ola|bom dia|boa tarde|boa noite|hey|e ai)\b/.test(text) && text.length < 25) {
      return { content: GREETING_ANSWER, provider: this.name };
    }

    let best: { score: number; answer: string } = { score: 0, answer: FALLBACK_ANSWER };
    for (const entry of knowledgeBase) {
      const score = entry.keywords.reduce((total, keyword) => (text.includes(normalize(keyword)) ? total + keyword.length : total), 0);
      if (score > best.score) best = { score, answer: entry.answer };
    }

    return { content: best.answer, provider: this.name };
  },
};
