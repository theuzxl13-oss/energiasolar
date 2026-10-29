"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchLeads, updateLeadStatus } from "@/lib/supabase/leads";
import type { Lead, LeadStatus } from "@/types";

/**
 * Leads do painel /admin.
 * - Com o Supabase configurado: lidos e atualizados no banco (exige login).
 * - Sem ele (MODO DEMONSTRAÇÃO): leads enviados pelos formulários ficam
 *   salvos neste navegador para aparecerem no painel.
 */

const LEADS_KEY = "demo:leads";
const STATUS_KEY = "demo:lead-status";
const EVENT = "demo-leads-change";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* armazenamento indisponível (modo privado) — ignora */
  }
}

export function saveDemoLead(lead: Lead) {
  if (isSupabaseConfigured) return;
  const current = read<Lead[]>(LEADS_KEY, []);
  write(LEADS_KEY, [lead, ...current.filter((item) => item.id !== lead.id)].slice(0, 100));
}

export function useDemoLeads() {
  const supabase = useSupabaseLeads();
  const local = useLocalLeads();
  return isSupabaseConfigured ? supabase : local;
}

function useSupabaseLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchLeads()
      .then((rows) => !cancelled && setLeads(rows))
      .catch(() => !cancelled && setError("Não foi possível carregar os leads. Atualize a página."))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const updateStatus = useCallback(
    (id: string, status: LeadStatus) => {
      const previous = leads.find((lead) => lead.id === id)?.status;
      const apply = (value: LeadStatus) => setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status: value } : lead)));
      apply(status);
      updateLeadStatus(id, status).catch(() => {
        if (previous) apply(previous);
        setError("Não foi possível salvar o status. Tente novamente.");
      });
    },
    [leads],
  );

  return { leads, ready, error, updateStatus, resetDemo: () => {}, localCount: 0 };
}

function useLocalLeads() {
  const [localLeads, setLocalLeads] = useState<Lead[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, LeadStatus>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setLocalLeads(read<Lead[]>(LEADS_KEY, []));
      setStatusOverrides(read<Record<string, LeadStatus>>(STATUS_KEY, {}));
      setReady(true);
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const leads = useMemo(() => {
    return localLeads
      .map((lead) => (statusOverrides[lead.id] ? { ...lead, status: statusOverrides[lead.id]! } : lead))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [localLeads, statusOverrides]);

  const updateStatus = useCallback((id: string, status: LeadStatus) => {
    write(STATUS_KEY, { ...read<Record<string, LeadStatus>>(STATUS_KEY, {}), [id]: status });
  }, []);

  const resetDemo = useCallback(() => {
    write(LEADS_KEY, []);
    write(STATUS_KEY, {});
  }, []);

  return { leads, ready, error: null, updateStatus, resetDemo, localCount: localLeads.length };
}
