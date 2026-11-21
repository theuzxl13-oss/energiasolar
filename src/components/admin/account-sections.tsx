"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Upload, UserPlus } from "lucide-react";
import { changePassword, createUser, listUsers, updateUser, type TeamMember } from "@/lib/backend/auth";
import { api } from "@/lib/backend/client";
import { useAdminAuth } from "./auth/admin-auth";
import { inputClass } from "./form-fields";
import { Panel } from "./ui";

/** Seções de Configurações ligadas ao servidor: equipe, senha e importação de dados. */
export function AccountSections() {
  const { profile } = useAdminAuth();
  const isAdmin = profile?.role === "admin";
  return (
    <>
      {isAdmin && <TeamSection selfId={profile.id} />}
      <PasswordSection />
      {isAdmin && <ImportSection />}
    </>
  );
}

const button =
  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60";
const message = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

function Feedback({ text, ok }: { text: string | null; ok?: boolean }) {
  if (!text) return null;
  return (
    <p role={ok ? "status" : "alert"} className={`mt-3 text-sm ${ok ? "text-brand-700" : "text-rose-700"}`}>
      {text}
    </p>
  );
}

/* ---------------------------------- Equipe --------------------------------- */

function TeamSection({ selfId }: { selfId: string }) {
  const [users, setUsers] = useState<TeamMember[] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "usuario" as "admin" | "usuario" });
  const [feedback, setFeedback] = useState<{ text: string; ok?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => listUsers().then((data) => setUsers(data.users), () => setUsers([])), []);
  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setFeedback(null);
    try {
      await action();
      setFeedback({ text: success, ok: true });
      await load();
    } catch (error) {
      setFeedback({ text: message(error, "Não foi possível concluir.") });
    }
    setBusy(false);
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    await run(async () => {
      await createUser({ ...form, email: form.email.trim(), name: form.name.trim() });
      setForm({ name: "", email: "", password: "", role: "usuario" });
    }, "Login criado. Passe a senha à pessoa por um canal seguro.");
  }

  return (
    <Panel title="Equipe (quem acessa o painel)">
      {!users ? (
        <LoaderCircle className="size-5 animate-spin text-slate-400" aria-label="Carregando…" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-semibold text-night-900">
                  {user.name || user.email} {user.id === selfId && <span className="text-xs font-normal text-slate-500">(você)</span>}
                </p>
                <p className="text-sm text-slate-500">
                  {user.email} • {user.role === "admin" ? "Administrador" : "Equipe"} • {user.active ? "Ativo" : "Desativado"} •{" "}
                  {user.mfa ? "App cadastrado" : "Sem app"}
                </p>
              </div>
              {user.id !== selfId && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={busy} className={button} onClick={() => run(() => updateUser(user.id, { active: !user.active }), user.active ? "Acesso desativado." : "Acesso reativado.")}>
                    {user.active ? "Desativar" : "Reativar"}
                  </button>
                  {user.mfa && (
                    <button
                      type="button"
                      disabled={busy}
                      className={button}
                      onClick={() =>
                        window.confirm(`Zerar o app de códigos de ${user.email}? No próximo login a pessoa cadastra o celular de novo.`) &&
                        run(() => updateUser(user.id, { resetMfa: true }), "App zerado. A pessoa cadastra o celular no próximo login.")
                      }
                    >
                      Zerar app (celular perdido)
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input required placeholder="Nome" className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input required type="email" placeholder="E-mail" className={inputClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input
          required
          type="password"
          minLength={12}
          autoComplete="new-password"
          placeholder="Senha inicial (12+ caracteres)"
          className={inputClass}
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <select className={inputClass} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as "admin" | "usuario" })} aria-label="Cargo">
          <option value="usuario">Equipe (leads, orçamentos e contratos)</option>
          <option value="admin">Administrador (tudo)</option>
        </select>
        <button type="submit" disabled={busy} className={`${button} justify-self-start`}>
          <UserPlus className="size-4" aria-hidden="true" /> Criar login
        </button>
      </form>
      <Feedback text={feedback?.text ?? null} ok={feedback?.ok} />
    </Panel>
  );
}

/* ---------------------------------- Senha ---------------------------------- */

function PasswordSection() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [feedback, setFeedback] = useState<{ text: string; ok?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.next !== form.confirm) return setFeedback({ text: "As senhas novas não conferem." });
    setBusy(true);
    setFeedback(null);
    try {
      await changePassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      setFeedback({ text: "Senha alterada. Os outros aparelhos conectados foram desconectados.", ok: true });
    } catch (error) {
      setFeedback({ text: message(error, "Não foi possível alterar a senha.") });
    }
    setBusy(false);
  }

  return (
    <Panel title="Alterar minha senha">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
        <input required type="password" autoComplete="current-password" placeholder="Senha atual" className={inputClass} value={form.current} onChange={(event) => setForm({ ...form, current: event.target.value })} />
        <input required type="password" minLength={12} autoComplete="new-password" placeholder="Nova senha" className={inputClass} value={form.next} onChange={(event) => setForm({ ...form, next: event.target.value })} />
        <input required type="password" autoComplete="new-password" placeholder="Repita a nova senha" className={inputClass} value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} />
        <button type="submit" disabled={busy} className={`${button} justify-self-start`}>
          Salvar nova senha
        </button>
      </form>
      <Feedback text={feedback?.text ?? null} ok={feedback?.ok} />
    </Panel>
  );
}

/* --------------------------------- Importar -------------------------------- */

const TABLES = [
  ["leads", "leads"],
  ["quotes", "orçamentos"],
  ["contracts", "contratos"],
  ["site_content", "blocos de conteúdo"],
] as const;

/** Envia um backup (deste site ou exportado do Supabase) em partes de 25 linhas. Não sobrescreve o que já existe. */
function ImportSection() {
  const [progress, setProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok?: boolean } | null>(null);

  async function importFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFeedback(null);
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(await file.text());
    } catch {
      return setFeedback({ text: "Arquivo inválido: escolha o .json do backup." });
    }
    const summary: string[] = [];
    try {
      for (const [table, label] of TABLES) {
        const rows = Array.isArray(data[table]) ? (data[table] as unknown[]) : [];
        let imported = 0;
        for (let start = 0; start < rows.length; start += 25) {
          setProgress(`Importando ${label}: ${start} de ${rows.length}…`);
          imported += (await api<{ imported: number }>("/api/admin/import", { body: { table, rows: rows.slice(start, start + 25) } })).imported;
        }
        if (rows.length) summary.push(`${imported} de ${rows.length} ${label}`);
      }
      setFeedback({
        text: summary.length
          ? `Importado: ${summary.join(", ")}. Itens que já existiam foram mantidos. Atualize a página para ver.`
          : "Nada para importar neste arquivo.",
        ok: true,
      });
    } catch (error) {
      setFeedback({ text: message(error, "A importação parou no meio. Tente de novo: o que já entrou não é duplicado.") });
    }
    setProgress(null);
  }

  return (
    <Panel title="Importar dados">
      <p className="text-sm text-slate-600">
        Restaura um backup (arquivo .json do e-mail mensal ou do botão “Baixar backup agora”) ou traz os dados exportados do Supabase. Itens que já
        existem não são alterados.
      </p>
      <label className={`${button} mt-3 cursor-pointer`}>
        {progress ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
        {progress ?? "Escolher arquivo .json"}
        <input type="file" accept="application/json,.json" className="sr-only" disabled={Boolean(progress)} onChange={importFile} />
      </label>
      <Feedback text={feedback?.text ?? null} ok={feedback?.ok} />
    </Panel>
  );
}
