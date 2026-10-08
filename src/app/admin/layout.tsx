import type { Metadata } from "next";
import { Info } from "lucide-react";
import { isDemoMode } from "@/config/site";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  title: { default: "Painel administrativo", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

/**
 * Layout do painel. A proteção de acesso é feita em `src/proxy.ts`
 * (HTTP Basic Auth via variáveis de ambiente) e deve evoluir para
 * Supabase Auth em produção (ver README).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-800">
      <AdminSidebar />
      <div className="lg:pl-64">
        {isDemoMode && (
          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200 sm:px-8">
            <Info className="size-4 shrink-0" aria-hidden="true" />
            Modo demonstração: dados fictícios. Solicitações enviadas pelo site neste navegador também aparecem aqui.
          </div>
        )}
        <main className="px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
