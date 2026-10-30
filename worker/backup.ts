/**
 * Backup por e-mail: exporta leads, orçamentos, contratos e conteúdo do site
 * (função `export_backup` do banco, com segredo) e envia pelo Resend.
 * Roda todo dia 1º (cron em wrangler.jsonc) ou pelo botão em Configurações.
 * Fotos dos projetos ficam no Storage do Supabase e não vão no e-mail.
 */
import { json, limited, readJsonPost, supabaseRpc, type Env } from "./http";

interface Backup {
  generated_at: string;
  leads: Record<string, unknown>[];
  quotes: unknown[];
  contracts: unknown[];
  site_content: unknown[];
  profiles: unknown[];
}

export const backupConfigured = (env: Env) => Boolean(env.BACKUP_SECRET && env.RESEND_API_KEY && env.BACKUP_EMAIL);

export async function runBackup(env: Env) {
  if (!backupConfigured(env)) throw new Error("Backup não configurado");
  const data = await supabaseRpc<Backup>(env, "export_backup", { secret: env.BACKUP_SECRET });
  const month = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
  const stamp = new Date().toISOString().slice(0, 10);
  const counts = { leads: data.leads.length, quotes: data.quotes.length, contracts: data.contracts.length };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Backup do site <onboarding@resend.dev>",
      to: [env.BACKUP_EMAIL],
      subject: `Backup do site — ${month}`,
      html: [
        `<p>Backup automático do site gerado em ${new Date(data.generated_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.</p>`,
        `<ul><li>Leads: ${counts.leads}</li><li>Orçamentos: ${counts.quotes}</li><li>Contratos: ${counts.contracts}</li></ul>`,
        "<p><strong>leads.csv</strong> abre no Excel. <strong>backup-completo.json</strong> tem tudo (leads, orçamentos, contratos e conteúdo do site) para restauração.</p>",
        "<p>Os anexos contêm dados pessoais de clientes: guarde em local seguro (LGPD).</p>",
      ].join(""),
      attachments: [
        { filename: `leads-${stamp}.csv`, content: toBase64("﻿" + leadsCsv(data.leads)) },
        { filename: `backup-completo-${stamp}.json`, content: toBase64(JSON.stringify(data, null, 2)) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Resend respondeu ${response.status}: ${(await response.text()).slice(0, 200)}`);
  return counts;
}

/** POST /api/backup/run: botão "Enviar backup agora" (só administrador com o código do app). */
export async function backupNow(request: Request, env: Env) {
  const read = await readJsonPost(request);
  if ("error" in read) return read.error;
  if (!backupConfigured(env)) return json({ error: "Backup não configurado." }, 503);
  if (await limited(env, request, "backup")) return json({ error: "Aguarde um instante." }, 429);

  const jwt = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Faça login." }, 401);
  // O próprio banco confere: administrador ativo e com a segunda etapa (aal2).
  const isAdmin = await supabaseRpc<boolean>(env, "is_admin", {}, jwt).catch(() => false);
  if (isAdmin !== true) return json({ error: "Apenas administradores podem enviar o backup." }, 403);

  try {
    return json({ sent: true, counts: await runBackup(env) });
  } catch (error) {
    console.error("[backup] Falha:", error instanceof Error ? error.message : error);
    return json({ error: "Não foi possível enviar o backup. Confira a chave do Resend e o e-mail cadastrado." }, 502);
  }
}

const LEAD_COLUMNS: [string, string][] = [
  ["created_at", "Data"],
  ["name", "Nome"],
  ["phone", "Telefone"],
  ["email", "E-mail"],
  ["city", "Cidade"],
  ["state", "UF"],
  ["service", "Serviço"],
  ["status", "Status"],
  ["source", "Origem"],
  ["message", "Mensagem"],
];

function leadsCsv(leads: Record<string, unknown>[]) {
  const cell = (value: unknown) => {
    let text = value === null || value === undefined ? "" : String(value);
    // Evita fórmulas maliciosas ao abrir no Excel (CSV injection).
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const header = LEAD_COLUMNS.map(([, label]) => cell(label)).join(";");
  return [header, ...leads.map((lead) => LEAD_COLUMNS.map(([key]) => cell(lead[key])).join(";"))].join("\r\n");
}

function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
}
