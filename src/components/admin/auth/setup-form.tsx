"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { setupAdmin, setupStatus } from "@/lib/backend/auth";
import { isBackendEnabled } from "@/lib/backend/client";
import { Field, inputClass } from "../form-fields";
import { CenteredCard } from "./admin-auth";

/**
 * Configuração inicial: cria o primeiro administrador. Só funciona enquanto não
 * existe nenhum login e exige o código ADMIN_SETUP_SECRET cadastrado na Cloudflare.
 */
export function SetupForm() {
  const router = useRouter();
  const [status, setStatus] = useState<{ needed: boolean; configured: boolean } | null>(null);
  const [form, setForm] = useState({ secret: "", name: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBackendEnabled) return setStatus({ needed: false, configured: false });
    setupStatus().then(setStatus, () => setStatus({ needed: false, configured: false }));
  }, []);

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: event.target.value });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.password !== form.confirm) return setError("As senhas não conferem.");
    setBusy(true);
    setError(null);
    try {
      await setupAdmin({ secret: form.secret.trim(), name: form.name.trim(), email: form.email.trim(), password: form.password });
      // Já entra logado (com a verificação em duas etapas ligada, o painel pede o app em seguida).
      router.replace("/admin");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Não foi possível configurar.");
      setBusy(false);
    }
  }

  return (
    <CenteredCard>
      <ShieldCheck className="mx-auto size-10 text-brand-600" aria-hidden="true" />
      <h1 className="mt-4 font-display text-xl font-bold text-night-900">Configurar o painel</h1>
      {status === null && <LoaderCircle className="mx-auto mt-6 size-6 animate-spin text-slate-400" aria-label="Carregando…" />}
      {status && !status.needed && (
        <>
          <p className="mt-3 text-sm text-slate-600">O painel já está configurado.</p>
          <Link href="/admin/login" className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Ir para o login
          </Link>
        </>
      )}
      {status?.needed && !status.configured && (
        <p className="mt-3 text-sm text-slate-600">
          Antes, cadastre o segredo <strong>ADMIN_SETUP_SECRET</strong> na Cloudflare (Workers &amp; Pages → dc-eco-energy → Settings → Variables and
          Secrets) e atualize esta página.
        </p>
      )}
      {status?.needed && status.configured && (
        <form onSubmit={submit} className="mt-6 grid gap-4 text-left">
          <p className="text-sm text-slate-600">Crie o login do administrador.</p>
          <Field label="Código de configuração" hint="O valor do segredo ADMIN_SETUP_SECRET cadastrado na Cloudflare.">
            <input type="password" required autoComplete="off" className={inputClass} value={form.secret} onChange={update("secret")} />
          </Field>
          <Field label="Seu nome">
            <input required autoComplete="name" className={inputClass} value={form.name} onChange={update("name")} />
          </Field>
          <Field label="E-mail">
            <input type="email" required autoComplete="username" className={inputClass} value={form.email} onChange={update("email")} />
          </Field>
          <Field label="Senha" hint="Mínimo de 12 caracteres, com letras e números.">
            <input type="password" required minLength={12} autoComplete="new-password" className={inputClass} value={form.password} onChange={update("password")} />
          </Field>
          <Field label="Repita a senha">
            <input type="password" required autoComplete="new-password" className={inputClass} value={form.confirm} onChange={update("confirm")} />
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
            {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />} Criar administrador
          </button>
        </form>
      )}
    </CenteredCard>
  );
}
