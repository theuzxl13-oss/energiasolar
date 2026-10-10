"use client";

import { sampleContract, type Contract } from "@/lib/contracts";
import { useStoredCollection } from "./use-stored-collection";

/** Contratos (modo demonstração: salvos no navegador). */
export function useContracts() {
  const { docs, ready, save, remove, getNextNumber } = useStoredCollection<Contract>({ key: "demo:contracts", seed: () => [sampleContract()] });
  return { contracts: docs, ready, saveContract: save, deleteContract: remove, getNextNumber };
}
