"use client";

import { useSearchParams } from "next/navigation";
import { useDemoContracts } from "@/hooks/use-demo-contracts";
import { CONTRACT_STATUS_LABELS } from "@/lib/contracts";
import { CONTRACT_STATUSES } from "@/types";
import { DocumentNotFound, DocumentViewer } from "../document-viewer";
import { ContractDocument } from "./contract-document";
import { contractEditHref } from "./contracts-list";

export function ContractViewerFromUrl() {
  const params = useSearchParams();
  const { contracts, ready, saveContract } = useDemoContracts();
  const contract = contracts.find((item) => item.id === params.get("id"));

  if (!contract) return <DocumentNotFound ready={ready} label="Contrato" backHref="/admin/contratos" backLabel="Voltar para contratos" />;

  return (
    <DocumentViewer
      backHref="/admin/contratos"
      backLabel="Voltar para contratos"
      editHref={contractEditHref(contract.id)}
      fileTitle={`Contrato ${contract.number.replace("/", "-")}${contract.client.name ? ` - ${contract.client.name}` : ""}`}
      status={contract.status}
      statuses={CONTRACT_STATUSES}
      statusLabels={CONTRACT_STATUS_LABELS}
      onStatusChange={(status) => saveContract({ ...contract, status })}
      autoPrint={params.get("imprimir") === "1"}
    >
      <ContractDocument contract={contract} />
    </DocumentViewer>
  );
}
