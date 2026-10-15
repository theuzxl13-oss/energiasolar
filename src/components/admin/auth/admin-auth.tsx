"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle, LogOut, ShieldAlert } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Login do painel com Supabase Auth.
 * - Páginas públicas do painel: /admin/login e /admin/redefinir-senha.
 * - Demais páginas: exigem sessão e perfil ativo em `public.profiles`.
 * A tela fica vazia para quem não está logado, e os dados em si são
 * protegidos pelo banco (Row Level Security), não por esta tela.
 */

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
}

interface AdminAuthValue {
  /** `false` quando o Supabase não está configurado (demonstração local, sem login). */
  enabled: boolean;
  profile: AdminProfile | null;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue>({ enabled: false, profile: null, signOut: async () => {} });

export const useAdminAuth = () => useContext(AdminAuthContext);

const PUBLIC_PATHS = ["/admin/login", "/admin/redefinir-senha"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

type State =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "no-access"; email: string }
  | { status: "signed-in"; profile: AdminProfile };

async function loadProfile(session: Session): Promise<State> {
  const { data, error } = await getSupabase().from("profiles").select("id, email, full_name, role, active").eq("id", session.user.id).maybeSingle();
  if (error || !data || !data.active) return { status: "no-access", email: session.user.email ?? "" };
  return { status: "signed-in", profile: { id: data.id, email: data.email, fullName: data.full_name, role: data.role, active: data.active } };
}

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return <AdminAuthContext.Provider value={{ enabled: false, profile: null, signOut: async () => {} }}>{children}</AdminAuthContext.Provider>;
  }
  return <SupabaseAuthGate>{children}</SupabaseAuthGate>;
}

function SupabaseAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const publicPage = isPublicPath(pathname);

  useEffect(() => {
    const supabase = getSupabase();
    let cancelled = false;
    const apply = async (session: Session | null) => {
      const next = session ? await loadProfile(session) : ({ status: "signed-out" } as const);
      if (!cancelled) setState(next);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      // Evita chamadas ao banco dentro do callback (recomendação do Supabase).
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") window.setTimeout(() => apply(session), 0);
    });
    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (state.status === "signed-out" && !publicPage) {
      router.replace(`/admin/login?voltar=${encodeURIComponent(pathname)}`);
    }
  }, [state.status, publicPage, pathname, router]);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
    setState({ status: "signed-out" });
    router.replace("/admin/login");
  }, [router]);

  const value: AdminAuthValue = { enabled: true, profile: state.status === "signed-in" ? state.profile : null, signOut };

  if (publicPage) return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;

  if (state.status === "no-access") {
    return (
      <CenteredCard>
        <ShieldAlert className="mx-auto size-10 text-amber-500" aria-hidden="true" />
        <h1 className="mt-4 font-display text-xl font-bold text-night-900">Acesso não autorizado</h1>
        <p className="mt-2 text-sm text-slate-600">
          O login <strong>{state.email}</strong> não tem permissão para usar o painel. Fale com o administrador.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-night-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-night-800"
        >
          <LogOut className="size-4" aria-hidden="true" /> Sair
        </button>
      </CenteredCard>
    );
  }

  if (state.status !== "signed-in") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100" role="status">
        <LoaderCircle className="size-6 animate-spin text-slate-400" aria-label="Verificando acesso…" />
      </div>
    );
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">{children}</div>
    </div>
  );
}

/** Indica se a página atual é pública (login/recuperação), para o layout esconder o menu. */
export function useIsAdminPublicPage() {
  return isPublicPath(usePathname());
}
