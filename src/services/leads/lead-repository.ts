import type { Lead, LeadStatus } from "@/types";

export type NewLead = Omit<Lead, "id" | "status" | "createdAt">;

export interface ListLeadsOptions {
  status?: LeadStatus;
  limit?: number;
}

/**
 * Contrato de persistência de leads.
 * A aplicação depende apenas desta interface; trocar a implementação
 * (memória → Supabase → outro banco) não exige mudanças nas rotas ou na UI.
 */
export interface LeadRepository {
  readonly name: string;
  create(lead: NewLead): Promise<Lead>;
  list(options?: ListLeadsOptions): Promise<Lead[]>;
  findById(id: string): Promise<Lead | null>;
  updateStatus(id: string, status: LeadStatus): Promise<Lead | null>;
}
