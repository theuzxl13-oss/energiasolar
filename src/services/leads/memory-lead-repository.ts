import "server-only";
import { mockLeads } from "@/data/mock/leads";
import { generateId } from "@/lib/utils";
import type { Lead } from "@/types";
import type { LeadRepository } from "./lead-repository";

/**
 * Repositório em memória (modo demonstração).
 * Os dados duram enquanto a instância do servidor estiver ativa — em
 * ambientes serverless podem ser reiniciados a qualquer momento.
 */
const store: Lead[] = [...mockLeads];

export const memoryLeadRepository: LeadRepository = {
  name: "memory",

  async create(input) {
    const lead: Lead = { ...input, id: generateId("lead"), status: "novo", createdAt: new Date().toISOString() };
    store.unshift(lead);
    return lead;
  },

  async list(options = {}) {
    const filtered = options.status ? store.filter((lead) => lead.status === options.status) : store;
    return filtered.slice(0, options.limit ?? filtered.length);
  },

  async findById(id) {
    return store.find((lead) => lead.id === id) ?? null;
  },

  async updateStatus(id, status) {
    const lead = store.find((item) => item.id === id);
    if (!lead) return null;
    lead.status = status;
    return lead;
  },
};
