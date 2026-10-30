"use client";

import { useEffect, useState } from "react";
import { CircleCheck, CircleDashed, LoaderCircle, Mail } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-content";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { recoveryCodesRemaining, RecoveryCodesPanel } from "./auth/mfa";
import { Panel } from "./ui";

/** Status das integrações. Nunca mostra valores secretos. */
export function IntegrationsPanel({ ai, googleReviews }: { ai: { active: boolean; detail: string }; googleReviews: boolean }) {
  const { settings } = useSiteSettings();
  const aiStatus = useAiStatus(ai);
  const server = useServerStatus();
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
      name: "“Não sou robô” nos formulários",
      active: server?.leadsViaServer === true,
      detail: server?.leadsViaServer
        ? "Formulários conferidos pelo Cloudflare Turnstile antes de gravar o lead."
        : "Não configurado. Cadastre TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY e LEAD_SUBMIT_SECRET na Cloudflare.",
    },
    {
      name: "Backup mensal por e-mail",
      active: server?.backup === true,
      detail: server?.backup
        ? "Todo dia 1º, leads, orçamentos, contratos e conteúdo do site são enviados por e-mail."
        : "Não configurado. Cadastre BACKUP_SECRET, RESEND_API_KEY e BACKUP_EMAIL na Cloudflare.",
      action: server?.backup ? <BackupNowButton /> : null,
    },
    {
      name: "Avaliações do Google",
      active: googleReviews,
      detail: googleReviews
        ? "Avaliações do Google exibidas no site."
        : "Não configurado. Sem depoimentos autorizados, a seção de depoimentos fica oculta no site.",
    },
  ];

  return (
    <>
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
              {"action" in integration && integration.action}
            </div>
          </li>
        ))}
      </ul>
      </Panel>
      {isSupabaseConfigured && <RecoveryCodesSection />}
    </>
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

/** O que está configurado no servidor (Cloudflare Worker). `null` enquanto carrega ou sem servidor. */
function useServerStatus() {
  const [status, setStatus] = useState<{ leadsViaServer: boolean; backup: boolean } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/status", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => !cancelled && data && setStatus(data))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return status;
}

function BackupNowButton() {
  const [state, setState] = useState<{ busy: boolean; message?: string; ok?: boolean }>({ busy: false });

  async function send() {
    setState({ busy: true });
    const { data } = await getSupabase().auth.getSession();
    const response = await fetch("/api/backup/run", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: "{}",
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { error?: string; counts?: { leads: number } } | null;
    setState(
      response?.ok
        ? { busy: false, ok: true, message: `Backup enviado (${body?.counts?.leads ?? 0} leads). Confira seu e-mail.` }
        : { busy: false, ok: false, message: body?.error ?? "Não foi possível enviar o backup." },
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={send}
        disabled={state.busy}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
      >
        {state.busy ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : <Mail className="size-3.5" aria-hidden="true" />} Enviar backup agora
      </button>
      {state.message && <p className={`mt-1 text-xs ${state.ok ? "text-brand-700" : "text-rose-700"}`}>{state.message}</p>}
    </div>
  );
}

function RecoveryCodesSection() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void recoveryCodesRemaining().then(setRemaining);
  }, [open]);

  return (
    <Panel title="Códigos reserva (celular perdido)">
      <p className="text-sm text-slate-600">
        {remaining === null
          ? "Recurso ainda não ativado no banco de dados."
          : `Você tem ${remaining} de 10 códigos reserva sem usar.${remaining <= 3 ? " Gere códigos novos." : ""}`}
      </p>
      {remaining !== null &&
        (open ? (
          <RecoveryCodesPanel intro={<p className="mt-2 text-sm text-slate-500">Ao gerar códigos novos, os antigos deixam de valer.</p>} />
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="mt-3 text-sm font-semibold text-brand-700 hover:underline">
            Gerar códigos novos
          </button>
        ))}
    </Panel>
  );
}
