"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { getMe, logout } from "@/lib/backend/auth";
import { isBackendEnabled } from "@/lib/backend/client";
import { MfaChallenge, MfaEnroll, RecoveryCodesSetup } from "./mfa";

/**
 * Login do painel (servidor da Cloudflare, rotas /api/auth/*).
 * - Páginas públicas do painel: login, redefinir senha e configuração inicial.
 * - Demais páginas: exigem senha + código do app (verificação em duas etapas).
 * Esta tela só organiza o fluxo: quem protege os dados é o servidor, que
 * recusa qualquer pedido sem o login completo.
 */

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
}

interface AdminAuthValue {
  /** `false` sem servidor (demonstração local, sem login). */
  enabled: boolean;
  profile: AdminProfile | null;
  signOut: () => Promise<void>;
  /** Confere o login de novo (depois de entrar com a senha, por exemplo). */
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue>({ enabled: false, profile: null, signOut: async () => {}, refresh: async () => {} });

export const useAdminAuth = () => useContext(AdminAuthContext);

const PUBLIC_PATHS = ["/admin/login", "/admin/redefinir-senha", "/admin/configurar"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

type State =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "mfa"; step: "challenge" | "enroll" }
  | { status: "recovery-codes"; profile: AdminProfile }
  | { status: "signed-in"; profile: AdminProfile };

async function loadState(): Promise<State> {
  const me = await getMe();
  if (!me) return { status: "signed-out" };
  if (me.mfa !== "ok") return { status: "mfa", step: me.mfa };
  const profile = { id: me.user.id, email: me.user.email, fullName: me.user.name, role: me.user.role, active: me.user.active };
  // Sem códigos reserva ainda: pede para gerar antes de entrar.
  if (me.recoveryRemaining === 0) return { status: "recovery-codes", profile };
  return { status: "signed-in", profile };
}

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  if (!isBackendEnabled) {
    return (
      <AdminAuthContext.Provider value={{ enabled: false, profile: null, signOut: async () => {}, refresh: async () => {} }}>{children}</AdminAuthContext.Provider>
    );
  }
  return <ServerAuthGate>{children}</ServerAuthGate>;
}

function ServerAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const publicPage = isPublicPath(pathname);
  // Em qual tipo de página o login foi conferido por último. Ao sair do login para o
  // painel, a resposta antiga ("ninguém logado") não pode decidir nada.
  const [checkedOnPublic, setCheckedOnPublic] = useState<boolean | null>(null);
  const current = checkedOnPublic === publicPage;

  const refresh = useCallback(async () => {
    setState(await loadState());
  }, []);

  // Confere o login ao abrir o painel e ao sair de uma página pública (ex.: depois do login).
  useEffect(() => {
    let cancelled = false;
    loadState().then((next) => {
      if (cancelled) return;
      setState(next);
      setCheckedOnPublic(publicPage);
    });
    return () => {
      cancelled = true;
    };
  }, [publicPage]);

  useEffect(() => {
    if (current && state.status === "signed-out" && !publicPage) {
      router.replace(`/admin/login?voltar=${encodeURIComponent(pathname)}`);
    }
  }, [current, state.status, publicPage, pathname, router]);

  const signOut = useCallback(async () => {
    await logout();
    setState({ status: "signed-out" });
    router.replace("/admin/login");
  }, [router]);

  const value: AdminAuthValue = { enabled: true, profile: state.status === "signed-in" ? state.profile : null, signOut, refresh };

  if (publicPage) return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;

  if (current && state.status === "mfa") {
    const recheck = () => {
      setState({ status: "loading" });
      void refresh();
    };
    return state.step === "enroll" ? <MfaEnroll onDone={recheck} onSignOut={signOut} /> : <MfaChallenge onDone={recheck} onSignOut={signOut} />;
  }

  if (current && state.status === "recovery-codes") {
    const { profile } = state;
    return <RecoveryCodesSetup onDone={() => setState({ status: "signed-in", profile })} onSignOut={signOut} />;
  }

  if (!current || state.status !== "signed-in") {
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
