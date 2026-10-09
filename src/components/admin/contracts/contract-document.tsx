import { siteConfig } from "@/config/site";
import { contractHeading, contractVariables, fillVariables, longDate } from "@/lib/contracts";
import { quantityWithWords } from "@/lib/extenso";
import { SERVICE_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import type { Contract } from "@/types";
import { LetterheadDocument } from "../letterhead";

function companyAddress() {
  const { street, district, city, state, zipCode } = siteConfig.address;
  return `${street}, ${district}, ${city}/${state}, CEP ${zipCode}`;
}

function clientQualification(contract: Contract) {
  const { client } = contract;
  const place = [client.address, client.city && client.state ? `${client.city}/${client.state}` : client.city].filter(Boolean).join(", ");
  if (client.kind === "pj") {
    return [
      `${client.name || "[RAZÃO SOCIAL]"}, pessoa jurídica de direito privado inscrita no CNPJ sob o nº ${client.document || "[CNPJ]"}`,
      place && `com sede em ${place}`,
      client.representative && `neste ato representada por ${client.representative}`,
    ]
      .filter(Boolean)
      .join(", ");
  }
  return [`${client.name || "[NOME COMPLETO]"}, inscrito(a) no CPF sob o nº ${client.document || "[CPF]"}`, place && `residente e domiciliado(a) em ${place}`].filter(Boolean).join(", ");
}

/** Contrato no papel timbrado da empresa. Cada parágrafo das seções vira uma cláusula numerada. */
export function ContractDocument({ contract }: { contract: Contract }) {
  const variables = contractVariables(contract);
  const subtitle = [
    `Contrato nº ${contract.number}`,
    SERVICE_LABELS[contract.service],
    `Início em ${formatDate(`${contract.startDate}T12:00:00`)}`,
    contract.billing === "mensal"
      ? contract.durationMonths
        ? `Vigência de ${quantityWithWords(contract.durationMonths, "mês", "meses")}`
        : "Prazo indeterminado"
      : `Execução em até ${contract.executionDays} dias`,
  ].join(" · ");

  let clauseNumber = 0;

  return (
    <LetterheadDocument>
      <h1 className="letterhead-doc__title">{contract.title || contractHeading(contract)}</h1>
      <p className="contract-doc__subtitle">{subtitle}</p>

      <h2 className="letterhead-doc__heading">{contractHeading(contract)}</h2>
      <p>
        <strong>CONTRATADA:</strong> {siteConfig.legalName}, pessoa jurídica de direito privado inscrita no CNPJ sob o nº {siteConfig.cnpj}, com sede em {companyAddress()}.
      </p>
      <p>
        <strong>CONTRATANTE:</strong> {clientQualification(contract)}.
      </p>
      <p>As partes acima identificadas têm, entre si, justo e contratado o presente instrumento, que se regerá pelas cláusulas e condições seguintes.</p>

      {contract.clauses.map((clause) => (
        <section key={clause.id} className="contract-doc__section">
          <h2 className="letterhead-doc__heading">{clause.title}</h2>
          {clause.body
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph) => {
              clauseNumber += 1;
              return (
                <p key={`${clause.id}-${clauseNumber}`}>
                  <strong>Cláusula {clauseNumber}ª.</strong> {fillVariables(paragraph, variables)}
                </p>
              );
            })}
        </section>
      ))}

      <div className="contract-doc__closing">
        <p>E, por estarem de acordo, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.</p>
        <p className="contract-doc__place">
          {contract.forum ? `${contract.forum.split("/")[0]}, ` : ""}
          {longDate(contract.startDate)}.
        </p>

        <div className="contract-doc__signatures">
          <div>
            <strong>CONTRATADA</strong>
            <span>{siteConfig.legalName}</span>
            <span>CNPJ {siteConfig.cnpj}</span>
          </div>
          <div>
            <strong>CONTRATANTE</strong>
            <span>{contract.client.name || "—"}</span>
            <span>
              {contract.client.kind === "pj" ? "CNPJ" : "CPF"} {contract.client.document || "—"}
            </span>
            {contract.client.kind === "pj" && contract.client.representative && <span>p.p. {contract.client.representative}</span>}
          </div>
        </div>
      </div>
    </LetterheadDocument>
  );
}
