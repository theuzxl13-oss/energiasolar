import "server-only";
import { serverEnv } from "@/lib/env";
import type { LeadRepository } from "./lead-repository";
import { memoryLeadRepository } from "./memory-lead-repository";
import { createSupabaseLeadRepository } from "./supabase-lead-repository";

let repository: LeadRepository | null = null;

/**
 * Seleciona a implementação de persistência conforme o ambiente:
 * Supabase quando configurado, memória (demonstração) caso contrário.
 */
export function getLeadRepository(): LeadRepository {
  if (repository) return repository;
  const { supabaseUrl, supabaseServiceRoleKey } = serverEnv();
  repository =
    supabaseUrl && supabaseServiceRoleKey
      ? createSupabaseLeadRepository(supabaseUrl, supabaseServiceRoleKey)
      : memoryLeadRepository;
  return repository;
}

export type { LeadRepository, NewLead } from "./lead-repository";
