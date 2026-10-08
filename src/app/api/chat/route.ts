import { NextResponse } from "next/server";
import { chatRequestSchema } from "@/lib/validations/chat";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { demoChatProvider, getChatProvider } from "@/services/ai";

/**
 * POST /api/chat
 * Rota segura do chat: valida a entrada, limita requisições por IP e
 * chama o provedor de IA no servidor (a chave nunca chega ao navegador).
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`chat:${ip}`, 20, 60_000).allowed) {
    return NextResponse.json({ error: "Muitas mensagens em pouco tempo. Aguarde um instante." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 });
  }

  // Mantém apenas o histórico recente para controlar custo e latência.
  const messages = parsed.data.messages.slice(-12);
  const provider = getChatProvider();

  try {
    const reply = await provider.reply(messages);
    return NextResponse.json({ reply: reply.content, provider: reply.provider });
  } catch (error) {
    console.error("[api/chat] Falha no provedor de IA:", error instanceof Error ? error.message : error);
    // Degrada para o modo demonstrativo em vez de quebrar a experiência.
    const fallback = await demoChatProvider.reply(messages);
    return NextResponse.json({ reply: fallback.content, provider: fallback.provider });
  }
}
