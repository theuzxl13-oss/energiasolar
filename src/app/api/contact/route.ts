import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validations/lead";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getLeadRepository } from "@/services/leads";

/**
 * POST /api/contact
 * Formulário de contato simplificado. Também gera um lead (origem "contato")
 * para que nenhuma oportunidade se perca no painel administrativo.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`contact:${ip}`, 8, 10 * 60_000).allowed) {
    return NextResponse.json({ error: "Muitas solicitações. Tente novamente em alguns minutos." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Verifique os campos do formulário.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { website, consent: _consent, subject, ...data } = parsed.data;
  if (website) return NextResponse.json({ ok: true }, { status: 201 });

  try {
    const lead = await getLeadRepository().create({
      ...data,
      service: subject,
      clientType: null,
      propertyType: null,
      averageBill: null,
      evCount: null,
      source: "contato",
      metadata: { consentAt: new Date().toISOString() },
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("[api/contact] Falha ao salvar contato:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Não foi possível enviar sua mensagem agora. Tente novamente." }, { status: 500 });
  }
}
