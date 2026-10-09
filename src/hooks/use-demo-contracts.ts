"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { mockContracts } from "@/data/mock/contracts";
import type { Contract } from "@/types";

/**
 * Armazenamento local dos contratos no MODO DEMONSTRAÇÃO (mesmo
 * padrão de `use-demo-leads`). Em produção, substitua pela tabela `contracts` do Supabase.
 */

const CONTRACTS_KEY = "demo:contracts";
/** IDs de contratos fictícios removidos pelo usuário. */
const HIDDEN_KEY = "demo:contracts-hidden";
const EVENT = "demo-contracts-change";

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

export function useDemoContracts() {
  const [local, setLocal] = useState<Contract[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setLocal(read<Contract[]>(CONTRACTS_KEY, []));
      setHidden(read<string[]>(HIDDEN_KEY, []));
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

  const contracts = useMemo(() => {
    // Um contrato salvo localmente substitui o fictício de mesmo id (edição).
    const localIds = new Set(local.map((item) => item.id));
    const mocks = mockContracts.filter((item) => !localIds.has(item.id) && !hidden.includes(item.id));
    return [...local, ...mocks].sort((a, b) => b.number.localeCompare(a.number));
  }, [local, hidden]);

  const saveContract = useCallback((contract: Contract) => {
    const current = read<Contract[]>(CONTRACTS_KEY, []);
    write(CONTRACTS_KEY, [{ ...contract, updatedAt: new Date().toISOString() }, ...current.filter((item) => item.id !== contract.id)]);
  }, []);

  const removeContract = useCallback((id: string) => {
    write(CONTRACTS_KEY, read<Contract[]>(CONTRACTS_KEY, []).filter((item) => item.id !== id));
    if (mockContracts.some((item) => item.id === id)) write(HIDDEN_KEY, [...read<string[]>(HIDDEN_KEY, []), id]);
  }, []);

  return { contracts, ready, saveContract, removeContract };
}
