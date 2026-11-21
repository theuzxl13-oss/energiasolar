"use client";

import { useEffect, useMemo, useState } from "react";
import { renderSVG } from "uqr";
import { Copy, Download, KeyRound, LifeBuoy, LoaderCircle, LogOut, Smartphone } from "lucide-react";
import { generateRecoveryCodes, getMe, redeemRecoveryCode, startEnroll, verifyCode } from "@/lib/backend/auth";
import { inputClass } from "../form-fields";
import { CenteredCard } from "./admin-auth";

/**
 * Verificação em duas etapas (TOTP): código de 6 dígitos gerado pelo app
 * Senhas do iPhone, Google Authenticator, Microsoft Authenticator etc.
 * O servidor só libera os dados do painel depois do código (sessão nível 2).
 */

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

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

async function confirmCode(code: string, onDone: () => void) {
  try {
    await verifyCode(code);
    onDone();
    return null;
  } catch (error) {
    return errorMessage(error, "Não foi possível confirmar o código. Tente novamente.");
  }
}

/** Pede o código de 6 dígitos de quem já cadastrou a verificação (ou um código reserva). */
export function MfaChallenge({ onDone, onSignOut }: { onDone: () => void; onSignOut: () => void }) {
  const [lostPhone, setLostPhone] = useState(false);
  if (lostPhone) return <RecoveryCodeLogin onRecovered={onDone} onBack={() => setLostPhone(false)} onSignOut={onSignOut} />;

  return (
    <CenteredCard>
      <Smartphone className="mx-auto size-10 text-brand-600" aria-hidden="true" />
      <h1 className="mt-4 font-display text-xl font-bold text-night-900">Verificação em duas etapas</h1>
      <p className="mt-2 text-sm text-slate-600">Abra o app Senhas (ou seu app autenticador) e digite o código do painel.</p>
      <CodeForm onSubmit={(code) => confirmCode(code, onDone)} label="Código de 6 dígitos" />
      <button type="button" onClick={() => setLostPhone(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
        <LifeBuoy className="size-4" aria-hidden="true" /> Perdi o celular: usar código reserva
      </button>
      <br />
      <SignOutLink onSignOut={onSignOut} />
    </CenteredCard>
  );
}

/** Primeiro acesso (ou celular novo): cadastra o código no app (obrigatório para usar o painel). */
export function MfaEnroll({ onDone, onSignOut }: { onDone: () => void; onSignOut: () => void }) {
  const [factor, setFactor] = useState<{ secret: string; uri: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const qr = useMemo(() => (factor ? `data:image/svg+xml;utf8,${encodeURIComponent(renderSVG(factor.uri, { border: 2 }))}` : null), [factor]);

  useEffect(() => {
    let cancelled = false;
    startEnroll().then(
      (data) => !cancelled && setFactor(data),
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, []);

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
      ) : !factor || !qr ? (
        <LoaderCircle className="mx-auto mt-6 size-6 animate-spin text-slate-400" aria-label="Gerando QR code…" />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code para o app de códigos" className="mx-auto mt-6 size-48 rounded-xl bg-white p-2 ring-1 ring-slate-200" />
          <p className="mt-4 text-xs text-slate-500">Está no próprio celular?</p>
          <a href={factor.uri} className="mt-1 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Abrir no app de códigos
          </a>
          <p className="mt-3 text-xs text-slate-500">Ou digite a chave manualmente:</p>
          <button type="button" onClick={copySecret} className="mt-1 inline-flex max-w-full items-center gap-1.5 break-all rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
            {factor.secret} <Copy className="size-3.5 shrink-0" aria-hidden="true" />
          </button>
          {copied && <p className="mt-1 text-xs text-brand-700">Chave copiada.</p>}
          <CodeForm onSubmit={(code) => confirmCode(code, onDone)} label="Código de 6 dígitos do app" />
        </>
      )}
      <SignOutLink onSignOut={onSignOut} />
    </CenteredCard>
  );
}

/* ------------------------------ Códigos reserva ----------------------------- */

/** Celular perdido: código reserva → apaga o app antigo → cadastra o celular novo. */
function RecoveryCodeLogin({ onRecovered, onBack, onSignOut }: { onRecovered: () => void; onBack: () => void; onSignOut: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await redeemRecoveryCode(code);
      onRecovered();
    } catch (problem) {
      setBusy(false);
      setError(errorMessage(problem, "Código reserva inválido ou já usado."));
    }
  }

  return (
    <CenteredCard>
      <LifeBuoy className="mx-auto size-10 text-brand-600" aria-hidden="true" />
      <h1 className="mt-4 font-display text-xl font-bold text-night-900">Usar código reserva</h1>
      <p className="mt-2 text-sm text-slate-600">
        Digite um dos códigos reserva que você guardou. Depois, cadastre o app de códigos no celular novo. Cada código reserva só funciona uma vez.
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-4 text-left">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Código reserva
          <input
            required
            autoFocus
            autoComplete="off"
            spellCheck={false}
            maxLength={24}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={`${inputClass} text-center font-mono tracking-widest`}
            placeholder="xxxx-xxxx-xxxx-xxxx"
          />
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || code.replace(/[^0-9a-z]/gi, "").length < 16}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />} Confirmar
        </button>
      </form>
      <button type="button" onClick={onBack} className="mt-4 text-sm font-semibold text-slate-600 hover:text-night-900">
        Voltar para o código do app
      </button>
      <br />
      <SignOutLink onSignOut={onSignOut} />
    </CenteredCard>
  );
}

/** Quantos códigos reserva ainda não usados; `null` se não for possível saber. */
export async function recoveryCodesRemaining(): Promise<number | null> {
  return (await getMe())?.recoveryRemaining ?? null;
}

/** Gera códigos reserva novos (os antigos deixam de valer) e mostra uma única vez. */
export function RecoveryCodesPanel({ onDone, intro }: { onDone?: () => void; intro?: React.ReactNode }) {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      setCodes((await generateRecoveryCodes()).codes);
    } catch (problem) {
      setError(errorMessage(problem, "Não foi possível gerar os códigos. Atualize a página e tente novamente."));
    }
    setBusy(false);
  }

  const text = codes ? `Códigos reserva do painel DC Eco Energy (cada um vale uma vez)\nGerados em ${new Date().toLocaleString("pt-BR")}\n\n${codes.join("\n")}\n` : "";

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "codigos-reserva-painel.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="text-left">
      {intro}
      {!codes ? (
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <LifeBuoy className="size-4" aria-hidden="true" />} Gerar códigos reserva
        </button>
      ) : (
        <>
          <ul className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-4 font-mono text-sm text-night-900 ring-1 ring-slate-200">
            {codes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              <Download className="size-4" aria-hidden="true" /> Baixar .txt
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true), () => undefined)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Copy className="size-4" aria-hidden="true" /> {copied ? "Copiados" : "Copiar"}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Guarde fora do celular: impressos, num gerenciador de senhas ou numa nota segura. Esta é a única vez que eles aparecem.
          </p>
          {onDone && (
            <>
              <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={saved} onChange={(event) => setSaved(event.target.checked)} className="mt-0.5 size-4 accent-brand-600" />
                Guardei os códigos em um lugar seguro.
              </label>
              <button
                type="button"
                onClick={onDone}
                disabled={!saved}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                Continuar para o painel
              </button>
            </>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
          {error}
        </p>
      )}
    </div>
  );
}

/** Tela obrigatória enquanto a pessoa não tiver códigos reserva. */
export function RecoveryCodesSetup({ onDone, onSignOut }: { onDone: () => void; onSignOut: () => void }) {
  return (
    <CenteredCard>
      <LifeBuoy className="mx-auto size-10 text-brand-600" aria-hidden="true" />
      <h1 className="mt-4 font-display text-xl font-bold text-night-900">Códigos reserva</h1>
      <RecoveryCodesPanel
        onDone={onDone}
        intro={
          <p className="mt-2 text-sm text-slate-600">
            Se perder o celular, um código reserva permite entrar e cadastrar o app no celular novo. São 10 códigos e cada um vale uma vez.
          </p>
        }
      />
      <SignOutLink onSignOut={onSignOut} />
    </CenteredCard>
  );
}
