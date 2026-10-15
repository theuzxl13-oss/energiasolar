"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Field, inputClass } from "../form-fields";
import { CenteredCard } from "./admin-auth";

/** Página aberta pelo link do e-mail de recuperação: define a nova senha. */
export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return setReady(false);
    const supabase = getSupabase();
    // O link do e-mail cria uma sessão temporária de recuperação.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    const timer = window.setTimeout(() => supabase.auth.getSession().then(({ data: current }) => setReady(Boolean(current.session))), 1500);
    return () => {
      data.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 10) return setError("Use pelo menos 10 caracteres.");
    if (password !== confirm) return setError("As senhas não conferem.");
    setBusy(true);
    setError(null);
    const { error: updateError } = await getSupabase().auth.updateUser({ password });
    setBusy(false);
    if (updateError) return setError("Não foi possível salvar a nova senha. Peça um novo link de recuperação.");
    router.replace("/admin");
  }

  return (
    <CenteredCard>
      <KeyRound className="mx-auto size-10 text-brand-600" aria-hidden="true" />
      <h1 className="mt-4 font-display text-xl font-bold text-night-900">Criar nova senha</h1>
      {ready === null && <LoaderCircle className="mx-auto mt-6 size-6 animate-spin text-slate-400" aria-label="Verificando link…" />}
      {ready === false && (
        <>
          <p className="mt-3 text-sm text-slate-600">Link inválido ou expirado. Peça um novo link na tela de login.</p>
          <Link href="/admin/login" className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Ir para o login
          </Link>
        </>
      )}
      {ready && (
        <form onSubmit={submit} className="mt-6 grid gap-4 text-left">
          <Field label="Nova senha" hint="Mínimo de 10 caracteres.">
            <input type="password" required autoComplete="new-password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field label="Repita a nova senha">
            <input type="password" required autoComplete="new-password" className={inputClass} value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </Field>
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
            {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />} Salvar nova senha
          </button>
        </form>
      )}
    </CenteredCard>
  );
}
