import { api } from "./client";

/**
 * Orçamentos e contratos no banco da Cloudflare. O documento completo vai
 * inteiro; as colunas de resumo servem para listagem e para o backup.
 */

export type DocumentTable = "quotes" | "contracts";

export interface DocumentSummary {
  number: string;
  status: string;
  title: string;
  clientName: string;
  total: number;
}

export const fetchDocuments = <T>(table: DocumentTable) => api<T[]>(`/api/admin/${table}`);

export async function upsertDocument<T extends { id: string }>(table: DocumentTable, doc: T, summary: DocumentSummary) {
  await api(`/api/admin/${table}/${encodeURIComponent(doc.id)}`, { method: "PUT", body: { doc, summary } });
}

export async function deleteDocument(table: DocumentTable, id: string) {
  await api(`/api/admin/${table}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
