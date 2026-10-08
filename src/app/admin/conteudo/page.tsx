import { siteConfig } from "@/config/site";
import { companyStats } from "@/config/stats";
import { mainNavigation } from "@/config/navigation";
import { AdminPageHeader, DemoNote, Panel } from "@/components/admin/ui";
import { DemoBadge } from "@/components/ui/primitives";

export const metadata = { title: "Conteúdo do Site" };

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[200px_1fr]">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium break-words text-night-900">{value || <span className="text-slate-400">Não definido</span>}</dd>
    </div>
  );
}

export default function AdminConteudoPage() {
  const { contact, address, social } = siteConfig;
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Conteúdo do Site" description="Dados institucionais, indicadores e navegação" />
      <DemoNote>
        Todos os dados da empresa estão centralizados em <code>src/config/site.ts</code> e os indicadores em <code>src/config/stats.ts</code>. Com o
        Supabase, esta tela pode editar a tabela <code>site_settings</code> diretamente.
      </DemoNote>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Dados da empresa">
          <dl className="divide-y divide-slate-100">
            <Row label="Nome" value={siteConfig.name} />
            <Row label="Razão social" value={siteConfig.legalName} />
            <Row label="CNPJ" value={siteConfig.cnpj} />
            <Row label="Telefone" value={contact.phoneDisplay} />
            <Row label="WhatsApp" value={`${contact.whatsappDisplay} (${contact.whatsapp})`} />
            <Row label="E-mail" value={contact.email} />
            <Row label="Endereço" value={`${address.street}, ${address.district} — ${address.city}/${address.state}`} />
            <Row label="Horário" value={siteConfig.businessHours.map((item) => `${item.label}: ${item.value}`).join(" • ")} />
          </dl>
        </Panel>
        <div className="space-y-6">
          <Panel title="Redes sociais">
            <dl className="divide-y divide-slate-100">
              <Row label="Instagram" value={social.instagram} />
              <Row label="Facebook" value={social.facebook} />
              <Row label="LinkedIn" value={social.linkedin} />
              <Row label="YouTube" value={social.youtube} />
            </dl>
          </Panel>
          <Panel title="Mensagem padrão do WhatsApp">
            <p className="text-sm text-slate-700">{siteConfig.whatsappDefaultMessage}</p>
          </Panel>
        </div>
      </div>

      <Panel title="Indicadores (Por que escolher)">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {companyStats.map((stat) => (
            <li key={stat.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="font-display text-2xl font-bold text-night-900">
                {stat.prefix}
                {stat.value.toLocaleString("pt-BR")}
                {stat.suffix}
              </p>
              <p className="text-sm text-slate-600">{stat.label}</p>
              {stat.isDemo && <DemoBadge tone="light" className="mt-2" />}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Menu principal">
        <ul className="flex flex-wrap gap-2">
          {mainNavigation.map((item) => (
            <li key={item.href} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
              {item.label} <span className="text-slate-400">{item.href}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
