"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, LoaderCircle } from "lucide-react";
import { checkResetToken, resetPassword } from "@/lib/backend/auth";
import { isBackendEnabled } from "@/lib/backend/client";
import { Field, inputClass } from "../form-fields";
import { CenteredCard } from "./admin-auth";

/**
 * Página aberta pelo link do e-mail de recuperação: define a nova senha.
 * Quem já cadastrou o app de códigos confirma o código também.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [check, setCheck] = useState<{ valid: boolean; needsCode: boolean } | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBackendEnabled || !token) return setCheck({ valid: false, needsCode: false });
    checkResetToken(token).then(setCheck, () => setCheck({ valid: false, needsCode: false }));
  }, [token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) return setError("As senhas não conferem.");
    setBusy(true);
    setError(null);
    try {
      await resetPassword({ token, password, code: check?.needsCode ? code : undefined });
      setDone(true);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Não foi possível salvar a nova senha. Peça um novo link.");
    }
    setBusy(false);
  }

  return (
    <CenteredCard>
      <KeyRound className="mx-auto size-10 text-brand-600" aria-hidden="true" />
      <h1 className="mt-4 font-display text-xl font-bold text-night-900">Criar nova senha</h1>
      {check === null && <LoaderCircle className="mx-auto mt-6 size-6 animate-spin text-slate-400" aria-label="Verificando link…" />}
      {check && !check.valid && (
        <>
          <p className="mt-3 text-sm text-slate-600">Link inválido ou expirado. Peça um novo link na tela de login.</p>
          <Link href="/admin/login" className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Ir para o login
          </Link>
        </>
      )}
      {done && (
        <>
          <p className="mt-3 text-sm text-slate-600">Senha alterada. Entre com a nova senha.</p>
          <button type="button" onClick={() => router.replace("/admin/login")} className="mt-6 text-sm font-semibold text-brand-700 hover:underline">
            Ir para o login
          </button>
        </>
      )}
      {check?.valid && !done && (
        <form onSubmit={submit} className="mt-6 grid gap-4 text-left">
          <Field label="Nova senha" hint="Mínimo de 12 caracteres, com letras e números.">
            <input type="password" required minLength={12} autoComplete="new-password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field label="Repita a nova senha">
            <input type="password" required autoComplete="new-password" className={inputClass} value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </Field>
          {check.needsCode && (
            <Field label="Código de 6 dígitos do app" hint="O mesmo do app Senhas (ou autenticador).">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                className={`${inputClass} font-mono tracking-[0.3em]`}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
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
            {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />} Salvar nova senha
          </button>
        </form>
      )}
    </CenteredCard>
  );
}
