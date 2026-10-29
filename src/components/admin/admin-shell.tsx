"use client";

import { Info } from "lucide-react";
import { isDemoMode } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { AdminSidebar } from "./admin-sidebar";
import { AdminAuthGate, useIsAdminPublicPage } from "./auth/admin-auth";

/** Moldura do painel: login obrigatório + menu lateral (exceto nas telas de login). */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGate>
      <Frame>{children}</Frame>
    </AdminAuthGate>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const publicPage = useIsAdminPublicPage();
  if (publicPage) return <>{children}</>;
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-800 print:min-h-0 print:bg-white">
      <div className="print:hidden">
        <AdminSidebar />
      </div>
      <div className="lg:pl-64 print:pl-0">
        {isDemoMode && (
          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200 sm:px-8 print:hidden">
            <Info className="size-4 shrink-0" aria-hidden="true" />
            {isSupabaseConfigured
              ? "Leads reais, salvos no banco de dados. Orçamentos e contratos ainda ficam salvos apenas neste navegador."
              : "Modo demonstração: dados fictícios. Solicitações enviadas pelo site neste navegador também aparecem aqui."}
          </div>
        )}
        <main className="px-4 py-8 sm:px-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
