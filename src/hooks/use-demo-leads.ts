"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { mockLeads } from "@/data/mock/leads";
import type { Lead, LeadStatus } from "@/types";

/**
 * Armazenamento local dos leads do MODO DEMONSTRAÇÃO.
 * Leads enviados pelos formulários são salvos no navegador para que
 * apareçam no painel /admin durante a apresentação.
 * Em produção, substitua por consultas à API/Supabase (ver README).
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
  const current = read<Lead[]>(LEADS_KEY, []);
  write(LEADS_KEY, [lead, ...current.filter((item) => item.id !== lead.id)].slice(0, 100));
}

export function useDemoLeads() {
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
    const merged = [...localLeads, ...mockLeads];
    return merged
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

  return { leads, ready, updateStatus, resetDemo, localCount: localLeads.length };
}
