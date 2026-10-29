"use client";

import { sampleContract, type Contract } from "@/lib/contracts";
import { useStoredCollection } from "./use-stored-collection";

/** Contratos (no Supabase; sem ele, salvos no navegador). */
export function useContracts() {
  const { docs, ready, save, remove, getNextNumber } = useStoredCollection<Contract>({ key: "demo:contracts", seed: () => [sampleContract()], table: "contracts", summary: (contract) => ({ number: contract.number, status: contract.status, title: contract.title, clientName: contract.client.name, total: contract.total }) });
  return { contracts: docs, ready, saveContract: save, deleteContract: remove, getNextNumber };
}
