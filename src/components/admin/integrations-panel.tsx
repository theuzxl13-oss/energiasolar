"use client";

import { useEffect, useState } from "react";
import { CircleCheck, CircleDashed } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-content";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Panel } from "./ui";

/** Status das integrações. Nunca mostra valores secretos. */
export function IntegrationsPanel({ ai, googleReviews }: { ai: { active: boolean; detail: string }; googleReviews: boolean }) {
  const { settings } = useSiteSettings();
  const aiStatus = useAiStatus(ai);
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
    { name: "Inteligência Artificial (chat)", active: aiStatus.active, detail: aiStatus.detail },
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

interface ChatStatus {
  configured: boolean;
  valid: boolean;
  problem?: "model" | "quota" | "key" | "network" | null;
  model: string;
}

const PROBLEMS: Record<string, string> = {
  key: "a chave foi recusada pelo Google. Confira se foi copiada inteira no segredo GEMINI_API_KEY da Cloudflare.",
  model: "o modelo configurado não existe. Confira GEMINI_MODEL na Cloudflare (ou apague para usar o padrão).",
  quota: "a cota gratuita do Gemini está esgotada no momento; o chat usa as respostas prontas até liberar.",
  network: "não foi possível falar com o Google agora. Tente de novo em instantes.",
};

/** No site estático, a IA roda no Worker da Cloudflare: pergunta a ele se a chave está pronta. */
function useAiStatus(fallback: { active: boolean; detail: string }) {
  const [status, setStatus] = useState<{ active: boolean; detail: string }>(fallback);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat/status", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<ChatStatus>) : null))
      .then((data) => {
        if (cancelled || !data || typeof data.configured !== "boolean") return;
        if (!data.configured) {
          setStatus({ active: false, detail: "Chave não cadastrada: o chat usa respostas prontas. Cadastre o segredo GEMINI_API_KEY na Cloudflare." });
        } else if (data.valid) {
          setStatus({ active: true, detail: `Gemini ativo e chave válida • Modelo: ${data.model}` });
        } else {
          setStatus({ active: false, detail: `Chave cadastrada, mas ${PROBLEMS[data.problem ?? "network"] ?? PROBLEMS.network}` });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
