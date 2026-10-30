"use client";

import { CircleCheck, CircleDashed } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-content";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Panel } from "./ui";

/** Status das integrações. Nunca mostra valores secretos. */
export function IntegrationsPanel({ ai, googleReviews }: { ai: { active: boolean; detail: string }; googleReviews: boolean }) {
  const { settings } = useSiteSettings();
  const whatsapp = settings.contact.whatsappDisplay;
  const whatsappSet = /\d/.test(whatsapp) && !/^[\s()0-]+$/.test(whatsapp);

  const integrations = [
    {
      name: "Banco de dados (Supabase)",
      active: isSupabaseConfigured,
      detail: isSupabaseConfigured
        ? "Leads, orçamentos, contratos e conteúdo do site salvos no Supabase."
        : "Não configurado: os dados ficam só neste navegador (demonstração).",
    },
    {
      name: "Proteção do painel",
      active: isSupabaseConfigured,
      detail: isSupabaseConfigured
        ? "Login com e-mail e senha (Supabase Auth). Os dados também são protegidos por regras de acesso no banco (RLS)."
        : "Sem login: configure o Supabase para proteger o painel.",
    },
    {
      name: "WhatsApp",
      active: whatsappSet,
      detail: whatsappSet ? `Número: ${whatsapp} (editável em Conteúdo do Site).` : "Número de exemplo. Altere em Conteúdo do Site.",
    },
    { name: "Inteligência Artificial (chat)", active: ai.active, detail: ai.detail },
    {
      name: "Avaliações do Google",
      active: googleReviews,
      detail: googleReviews
        ? "Avaliações do Google exibidas no site."
        : "Não configurado. Sem depoimentos autorizados, a seção de depoimentos fica oculta no site.",
    },
  ];

  return (
    <Panel title="Integrações">
      <ul className="divide-y divide-slate-100">
        {integrations.map((integration) => (
          <li key={integration.name} className="flex items-start gap-3 py-4">
            {integration.active ? (
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-600" aria-label="Configurado" />
            ) : (
              <CircleDashed className="mt-0.5 size-5 shrink-0 text-slate-400" aria-label="Não configurado" />
            )}
            <div>
              <p className="font-semibold text-night-900">{integration.name}</p>
              <p className="text-sm text-slate-500">{integration.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
