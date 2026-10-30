import { serverEnv } from "@/lib/env";
import { isDemoMode, siteConfig } from "@/config/site";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { IntegrationsPanel } from "@/components/admin/integrations-panel";

export const metadata = { title: "Configurações" };

/** Mostra apenas SE cada integração está configurada — nunca os valores secretos. */
export default function AdminConfiguracoesPage() {
  const env = serverEnv();
  const staticSite = process.env.NEXT_PUBLIC_STATIC_DEMO === "true";
  const ai = env.aiApiKey && !staticSite
    ? { active: true, detail: `Provedor: ${env.aiProvider} • Modelo: ${env.aiModel}` }
    : {
        active: false,
        detail: staticSite
          ? "Respostas automáticas (base de conhecimento local). A IA exige um servidor para guardar a chave com segurança."
          : "Respostas automáticas (base de conhecimento local). Defina AI_API_KEY.",
      };

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
            <dt className="text-slate-500">Hospedagem</dt>
            <dd className="font-semibold text-night-900">{staticSite ? "Site estático (Cloudflare)" : "Servidor Node"}</dd>
          </div>
        </dl>
      </Panel>
      <IntegrationsPanel ai={ai} googleReviews={Boolean(env.googlePlacesApiKey && env.googlePlaceId)} />
    </div>
  );
}
