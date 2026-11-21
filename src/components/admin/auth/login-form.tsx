"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LoaderCircle, LogIn, MailCheck } from "lucide-react";
import { brandMonogram } from "@/components/layout/logo";
import { login, requestPasswordReset } from "@/lib/backend/auth";
import { isBackendEnabled } from "@/lib/backend/client";
import { Field, inputClass } from "../form-fields";
import { CenteredCard, useAdminAuth } from "./admin-auth";

/** Só aceita voltar para páginas do próprio painel (evita redirecionamento para outros sites). */
function safeReturn(path: string | null) {
  return path && path.startsWith("/admin") && !path.startsWith("/admin/login") ? path : "/admin";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile } = useAdminAuth();
  const target = safeReturn(params.get("voltar"));
  const [mode, setMode] = useState<"login" | "forgot" | "sent">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Já logado: segue direto para o painel.
  useEffect(() => {
    if (profile) router.replace(target);
  }, [profile, router, target]);

  if (!isBackendEnabled) {
    return (
      <CenteredCard>
        <p className="text-sm text-slate-600">Login desativado: o servidor do site não está ligado neste ambiente.</p>
        <Link href="/admin" className="mt-4 inline-block text-sm font-semibold text-brand-700">
          Abrir painel de demonstração
        </Link>
      </CenteredCard>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "forgot") {
        // Mesmo resultado para e-mails cadastrados ou não (não revela quem tem acesso).
        await requestPasswordReset(email.trim());
        setMode("sent");
      } else {
        await login(email.trim(), password);
        // Com a verificação em duas etapas ligada, o painel pede o código do app em seguida.
        router.replace(target);
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Não foi possível entrar agora. Verifique sua conexão e tente novamente.");
    }
    setBusy(false);
  }

  return (
    <CenteredCard>
      <Image src={brandMonogram} alt="" className="mx-auto h-12 w-auto" sizes="96px" priority />
      <h1 className="mt-4 font-display text-xl font-bold text-night-900">{mode === "login" ? "Entrar no painel" : "Recuperar senha"}</h1>

      {mode === "sent" ? (
        <>
          <MailCheck className="mx-auto mt-6 size-10 text-brand-600" aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-600">
            Se <strong>{email}</strong> tiver acesso ao painel, você receberá um e-mail com o link para criar uma nova senha. Confira também a caixa de spam.
          </p>
          <button type="button" onClick={() => setMode("login")} className="mt-6 text-sm font-semibold text-brand-700 hover:underline">
            Voltar para o login
          </button>
        </>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-4 text-left">
          <Field label="E-mail">
            <input type="email" required autoComplete="username" className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          {mode === "login" && (
            <Field label="Senha">
              <input type="password" required autoComplete="current-password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <LogIn className="size-4" aria-hidden="true" />}
            {mode === "login" ? "Entrar" : "Enviar link de recuperação"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "forgot" : "login");
              setError(null);
            }}
            className="text-center text-sm font-semibold text-slate-600 hover:text-night-900"
          >
            {mode === "login" ? "Esqueci minha senha" : "Voltar para o login"}
          </button>
        </form>
      )}

      <Link href="/" className="mt-8 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-night-900">
        <ArrowLeft className="size-3.5" aria-hidden="true" /> Voltar ao site
      </Link>
    </CenteredCard>
  );
}
