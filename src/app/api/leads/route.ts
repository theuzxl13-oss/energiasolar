import { NextResponse } from "next/server";
import { leadApiSchema } from "@/lib/validations/lead";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getLeadRepository } from "@/services/leads";

/**
 * POST /api/leads
 * Recebe solicitações de orçamento/contato, valida com o MESMO schema do
 * frontend e persiste via repositório (memória ou Supabase).
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`leads:${ip}`, 8, 10 * 60_000).allowed) {
    return NextResponse.json({ error: "Muitas solicitações. Tente novamente em alguns minutos." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = leadApiSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Verifique os campos do formulário.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { consent: _consent, website, ...data } = parsed.data;

  // Honeypot preenchido → provável bot. Responde sucesso sem gravar.
  if (website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  try {
    const lead = await getLeadRepository().create({
      ...data,
      metadata: { ...data.metadata, consentAt: new Date().toISOString() },
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("[api/leads] Falha ao salvar lead:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Não foi possível registrar sua solicitação agora. Tente novamente." }, { status: 500 });
  }
}
