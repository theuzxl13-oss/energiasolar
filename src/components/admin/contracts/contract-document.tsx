"use client";

import { siteConfig } from "@/config/site";
import { clientParagraph, contractMetaLine, contractorParagraph, fillContractTokens, longDate, type Contract } from "@/lib/contracts";
import { DOC_GREEN as GREEN, DOC_NAVY as NAVY } from "../documents/letterhead-page";
import { PaginatedLetterhead, type DocumentBlock } from "../documents/paginated-letterhead";

/** Parágrafo padrão do contrato (texto justificado). */
function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="pb-[2.6mm] text-justify text-[9.5pt] leading-[1.55] text-[#1f2937] [hyphens:auto]">{children}</p>;
}

function SignatureLine({ role, name, doc }: { role: string; name: string; doc: string }) {
  return (
    <div className="text-center text-[8.5pt]">
      <div className="mb-[1.5mm] border-t border-[#6b7280]" />
      <p className="text-[7pt] font-semibold tracking-[0.12em] uppercase" style={{ color: GREEN }}>
        {role}
      </p>
      <p className="mt-[0.5mm]" style={{ color: NAVY }}>
        {name}
      </p>
      <p className="text-[#6b7280]">{doc}</p>
    </div>
  );
}

/** Monta os blocos do contrato (cabeçalho, partes, cláusulas, assinaturas) para a paginação automática. */
function buildBlocks(contract: Contract): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  const clientDoc = `${contract.client.docType} ${contract.client.document.trim() || (contract.client.docType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00")}`;

  blocks.push({
    key: "header",
    node: (
      <div className="pb-[5mm]">
        <h1 className="text-[15pt] leading-tight font-bold" style={{ color: NAVY }}>
          {contract.title}
        </h1>
        <p className="mt-[1mm] text-[8pt] text-[#6b7280]">{contractMetaLine(contract)}</p>
        <p className="mt-[5mm] text-center text-[10pt] font-bold tracking-[0.18em] uppercase" style={{ color: GREEN }}>
          {contract.contractType}
        </p>
      </div>
    ),
  });

  blocks.push({
    key: "contratada",
    node: (
      <Paragraph>
        <strong style={{ color: NAVY }}>CONTRATADA:</strong> {contractorParagraph()}
      </Paragraph>
    ),
  });
  blocks.push({
    key: "contratante",
    node: (
      <Paragraph>
        <strong style={{ color: NAVY }}>CONTRATANTE:</strong> {clientParagraph(contract)}
      </Paragraph>
    ),
  });
  blocks.push({
    key: "preambulo",
    node: <Paragraph>As partes acima identificadas têm, entre si, justo e contratado o presente instrumento, que se regerá pelas cláusulas e condições seguintes.</Paragraph>,
  });

  // Cláusulas numeradas em sequência ao longo de todas as seções.
  let clauseNumber = 0;
  for (const section of contract.sections) {
    const clauses = section.clauses.filter((clause) => clause.trim());
    if (!clauses.length) continue;
    blocks.push({
      key: `${section.id}-title`,
      keepWithNext: true,
      node: (
        <h2 className="pt-[2mm] pb-[1.5mm] text-[8.5pt] font-bold tracking-[0.14em] uppercase" style={{ color: GREEN }}>
          {section.title}
        </h2>
      ),
    });
    clauses.forEach((clause, index) => {
      clauseNumber += 1;
      blocks.push({
        key: `${section.id}-${index}`,
        node: (
          <Paragraph>
            <strong style={{ color: NAVY }}>Cláusula {clauseNumber}ª.</strong> {fillContractTokens(clause, contract)}
          </Paragraph>
        ),
      });
    });
  }

  blocks.push({
    key: "fechamento",
    keepWithNext: true,
    node: (
      <div className="pt-[2mm]">
        <Paragraph>E, por estarem de acordo, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.</Paragraph>
        <p className="pb-[10mm] text-right text-[9.5pt] text-[#1f2937]">
          {contract.signingCity}, {longDate(contract.signingDate)}.
        </p>
      </div>
    ),
  });

  blocks.push({
    key: "assinaturas",
    node: (
      <div className="pt-[6mm]">
        <div className="grid grid-cols-2 gap-[12mm]">
          <SignatureLine role="Contratada" name={siteConfig.legalName} doc={`CNPJ ${siteConfig.cnpj}`} />
          <SignatureLine role="Contratante" name={contract.client.name || "Cliente"} doc={clientDoc} />
        </div>
        {contract.witnesses && (
          <div className="mt-[14mm] grid grid-cols-2 gap-[12mm]">
            <SignatureLine role="Testemunha 1" name="Nome:" doc="CPF:" />
            <SignatureLine role="Testemunha 2" name="Nome:" doc="CPF:" />
          </div>
        )}
      </div>
    ),
  });

  return blocks;
}

export function ContractDocument({ contract }: { contract: Contract }) {
  return <PaginatedLetterhead blocks={buildBlocks(contract)} version={JSON.stringify(contract)} />;
}
