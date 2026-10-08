import { CircleCheck, CircleDashed } from "lucide-react";
import { serverEnv } from "@/lib/env";
import { isDemoMode, siteConfig } from "@/config/site";
import { getLeadRepository } from "@/services/leads";
import { AdminPageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

/** Mostra apenas SE cada integração está configurada — nunca os valores secretos. */
export default function AdminConfiguracoesPage() {
  const env = serverEnv();
  const integrations = [
    {
      name: "Inteligência Artificial (chat)",
      active: Boolean(env.aiApiKey),
      detail: env.aiApiKey ? `Provedor: ${env.aiProvider} • Modelo: ${env.aiModel}` : "Modo demonstrativo (base de conhecimento local). Defina AI_API_KEY.",
    },
    {
      name: "Banco de dados (Supabase)",
      active: getLeadRepository().name === "supabase",
      detail: getLeadRepository().name === "supabase" ? "Leads persistidos no Supabase." : "Leads em memória (demonstração). Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
    },
    {
      name: "Avaliações do Google",
      active: Boolean(env.googlePlacesApiKey && env.googlePlaceId),
      detail: env.googlePlacesApiKey ? "Sincronização a cada 24h." : "Depoimentos demonstrativos. Defina GOOGLE_PLACES_API_KEY e GOOGLE_PLACE_ID.",
    },
    {
      name: "WhatsApp",
      active: !/^550+$/.test(siteConfig.contact.whatsapp),
      detail: `Número configurado em src/config/site.ts: ${siteConfig.contact.whatsapp}`,
    },
    {
      name: "Proteção do painel",
      active: Boolean(process.env.ADMIN_BASIC_AUTH_USER && process.env.ADMIN_BASIC_AUTH_PASSWORD),
      detail: "HTTP Basic Auth via ADMIN_BASIC_AUTH_USER / ADMIN_BASIC_AUTH_PASSWORD. Evoluir para Supabase Auth em produção.",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Configurações" description="Status das integrações e do ambiente" />
      <Panel title="Ambiente">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Modo</dt>
            <dd className="font-semibold text-night-900">{isDemoMode ? "Demonstração" : "Produção"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">URL do site</dt>
            <dd className="font-semibold break-all text-night-900">{siteConfig.url}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Ambiente Node</dt>
            <dd className="font-semibold text-night-900">{process.env.NODE_ENV}</dd>
          </div>
        </dl>
      </Panel>
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
    </div>
  );
}
