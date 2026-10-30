"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound, LoaderCircle, LogOut, Smartphone } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { inputClass } from "../form-fields";
import { CenteredCard } from "./admin-auth";

/**
 * Verificação em duas etapas (TOTP): código de 6 dígitos gerado pelo app
 * Senhas do iPhone, Google Authenticator, Microsoft Authenticator etc.
 * O banco também exige a segunda etapa (`public.is_staff()` / `is_admin()`).
 */

export type MfaStatus = "ok" | "challenge" | "enroll";

/** "enroll" = ainda não cadastrou o código; "challenge" = falta digitar o código nesta sessão. */
export async function getMfaStatus(): Promise<MfaStatus> {
  const { data, error } = await getSupabase().auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return "enroll";
  if (data.currentLevel === "aal2") return "ok";
  return data.nextLevel === "aal2" ? "challenge" : "enroll";
}

function codeError(message: string) {
  if (/invalid|expired|code/i.test(message)) return "Código incorreto ou expirado. Confira no app e tente de novo.";
  if (/rate|too many/i.test(message)) return "Muitas tentativas. Aguarde alguns minutos.";
  return "Não foi possível confirmar o código. Tente novamente.";
}

function CodeForm({ onSubmit, label }: { onSubmit: (code: string) => Promise<string | null>; label: string }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const problem = await onSubmit(code);
    setBusy(false);
    if (problem) {
      setError(problem);
      setCode("");
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 text-left">
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        {label}
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className={`${inputClass} text-center font-mono text-2xl tracking-[0.4em]`}
          placeholder="000000"
        />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || code.length !== 6}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />} Confirmar
      </button>
    </form>
  );
}

function SignOutLink({ onSignOut }: { onSignOut: () => void }) {
  return (
    <button type="button" onClick={onSignOut} className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-night-900">
      <LogOut className="size-3.5" aria-hidden="true" /> Sair
    </button>
  );
}

/** Pede o código de 6 dígitos de quem já cadastrou a verificação. */
export function MfaChallenge({ onDone, onSignOut }: { onDone: () => void; onSignOut: () => void }) {
  async function verify(code: string) {
    const supabase = getSupabase();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp[0];
    if (!factor) return "Nenhum código cadastrado. Fale com o administrador.";
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (error) return codeError(error.message);
    onDone();
    return null;
  }

  return (
    <CenteredCard>
      <Smartphone className="mx-auto size-10 text-brand-600" aria-hidden="true" />
      <h1 className="mt-4 font-display text-xl font-bold text-night-900">Verificação em duas etapas</h1>
      <p className="mt-2 text-sm text-slate-600">Abra o app Senhas (ou seu app autenticador) e digite o código do painel.</p>
      <CodeForm onSubmit={verify} label="Código de 6 dígitos" />
      <SignOutLink onSignOut={onSignOut} />
    </CenteredCard>
  );
}

/** Primeiro acesso: cadastra o código no app (obrigatório para usar o painel). */
export function MfaEnroll({ onDone, onSignOut }: { onDone: () => void; onSignOut: () => void }) {
  const [factor, setFactor] = useState<{ id: string; qr: string; secret: string; uri: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabase();
      // Remove cadastros que ficaram pela metade (ex.: página fechada antes de confirmar).
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const item of existing?.all ?? []) {
        if (item.factor_type === "totp" && item.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: item.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", issuer: "DC Eco Energy", friendlyName: `Painel ${new Date().toISOString()}` });
      if (cancelled) return;
      if (error || !data) return setFailed(true);
      setFactor({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function verify(code: string) {
    if (!factor) return "Aguarde o QR code carregar.";
    const { error } = await getSupabase().auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (error) return codeError(error.message);
    onDone();
    return null;
  }

  async function copySecret() {
    if (!factor) return;
    await navigator.clipboard.writeText(factor.secret).catch(() => undefined);
    setCopied(true);
  }

  return (
    <CenteredCard>
      <Smartphone className="mx-auto size-10 text-brand-600" aria-hidden="true" />
      <h1 className="mt-4 font-display text-xl font-bold text-night-900">Ative a verificação em duas etapas</h1>
      <p className="mt-2 text-sm text-slate-600">
        Para proteger o painel, além da senha será pedido um código do seu celular. Faça isso uma única vez:
      </p>
      <ol className="mt-4 space-y-1.5 text-left text-sm text-slate-600">
        <li>
          1. <strong>iPhone:</strong> aponte a câmera para o QR code e toque em “Adicionar código de verificação” (app Senhas).
          <br />
          <span className="text-slate-500">Android: use o Google Authenticator → “+” → Ler QR code.</span>
        </li>
        <li>2. Digite abaixo o código de 6 dígitos que aparecer no app.</li>
      </ol>

      {failed ? (
        <p role="alert" className="mt-6 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
          Não foi possível iniciar o cadastro. Atualize a página e tente novamente.
        </p>
      ) : !factor ? (
        <LoaderCircle className="mx-auto mt-6 size-6 animate-spin text-slate-400" aria-label="Gerando QR code…" />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={factor.qr} alt="QR code para o app de códigos" className="mx-auto mt-6 size-48 rounded-xl bg-white p-2 ring-1 ring-slate-200" />
          <p className="mt-4 text-xs text-slate-500">Está no próprio celular?</p>
          <a href={factor.uri} className="mt-1 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Abrir no app de códigos
          </a>
          <p className="mt-3 text-xs text-slate-500">Ou digite a chave manualmente:</p>
          <button type="button" onClick={copySecret} className="mt-1 inline-flex max-w-full items-center gap-1.5 break-all rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
            {factor.secret} <Copy className="size-3.5 shrink-0" aria-hidden="true" />
          </button>
          {copied && <p className="mt-1 text-xs text-brand-700">Chave copiada.</p>}
          <CodeForm onSubmit={verify} label="Código de 6 dígitos do app" />
        </>
      )}
      <SignOutLink onSignOut={onSignOut} />
    </CenteredCard>
  );
}
