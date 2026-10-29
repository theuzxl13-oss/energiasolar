import { getSupabase } from "./client";

/**
 * Orçamentos e contratos no Supabase (tabelas `quotes` e `contracts`).
 * O documento completo vai na coluna `doc` (JSON) com o id usado pelo painel;
 * as demais colunas servem para listagem. Acesso: equipe logada (RLS).
 */

export type DocumentTable = "quotes" | "contracts";

export interface DocumentSummary {
  number: string;
  status: string;
  title: string;
  clientName: string;
  total: number;
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Id do banco (uuid) a partir do id do painel: usa o uuid embutido ou gera um fixo a partir do texto. */
export function rowId(id: string) {
  const match = id.match(UUID);
  if (match) return match[0].toLowerCase();
  // Hash FNV-1a com 4 sementes → 128 bits estáveis (ids antigos, ex.: "demo-quote-0001").
  const hex = [0x811c9dc5, 0x01000193, 0x050c5d1f, 0x2166136b]
    .map((seed) => {
      let hash = seed;
      for (let index = 0; index < id.length; index++) hash = Math.imul(hash ^ id.charCodeAt(index), 0x01000193);
      return (hash >>> 0).toString(16).padStart(8, "0");
    })
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export async function fetchDocuments<T>(table: DocumentTable): Promise<T[]> {
  const { data, error } = await getSupabase().from(table).select("doc");
  if (error) throw error;
  return (data as { doc: T }[]).map((row) => row.doc);
}

export async function upsertDocument<T extends { id: string }>(table: DocumentTable, doc: T, summary: DocumentSummary) {
  const { error } = await getSupabase()
    .from(table)
    .upsert({
      id: rowId(doc.id),
      number: summary.number,
      status: summary.status,
      title: summary.title,
      client_name: summary.clientName,
      total: summary.total,
      doc,
    });
  if (error) throw error;
}

export async function deleteDocument(table: DocumentTable, id: string) {
  const { error } = await getSupabase().from(table).delete().eq("id", rowId(id));
  if (error) throw error;
}
