import { siteConfig } from "@/config/site";
import { currencyToWords } from "@/lib/extenso";
import { formatIsoDate, formatQuantity, itemTotal, quoteTotals, quoteValidUntil } from "@/lib/quotes";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Quote } from "@/types";
import { LetterheadDocument } from "../letterhead";

/** Orçamento no papel timbrado da empresa. */
export function QuoteDocument({ quote }: { quote: Quote }) {
  const { subtotal, discount, total } = quoteTotals(quote);
  const highlights = quote.highlights.filter((item) => item.label.trim() && item.value.trim());
  const items = quote.items.filter((item) => item.description.trim());
  const client = quote.client;
  const clientFields = [
    { label: "Cliente", value: client.name },
    { label: client.document.replace(/\D/g, "").length > 11 ? "CNPJ" : "CPF", value: client.document },
    { label: "Telefone", value: client.phone },
    { label: "E-mail", value: client.email },
    { label: "Endereço", value: [client.address, client.city && client.state ? `${client.city}/${client.state}` : client.city].filter(Boolean).join(", ") },
    { label: "Local da instalação", value: quote.installAddress },
  ].filter((field) => field.value.trim());

  const conditions = [
    { label: "Forma de pagamento", value: quote.paymentTerms },
    { label: "Prazo de execução", value: quote.executionDays ? `Até ${quote.executionDays} dias após a aprovação e a liberação do local.` : "" },
    { label: "Validade da proposta", value: `${quote.validityDays} dias (até ${formatDate(quoteValidUntil(quote).toISOString())}).` },
    { label: "Garantia", value: quote.warranty },
  ].filter((field) => field.value.trim());

  return (
    <LetterheadDocument>
      <div className="quote-doc__top">
        <div>
          <p className="quote-doc__kicker">Orçamento</p>
          <h1 className="letterhead-doc__title">{quote.title || "Proposta comercial"}</h1>
        </div>
        <dl className="quote-doc__meta">
          <div>
            <dt>Nº</dt>
            <dd>{quote.number}</dd>
          </div>
          <div>
            <dt>Emissão</dt>
            <dd>{formatIsoDate(quote.issueDate)}</dd>
          </div>
          <div>
            <dt>Validade</dt>
            <dd>{formatDate(quoteValidUntil(quote).toISOString())}</dd>
          </div>
        </dl>
      </div>

      {clientFields.length > 0 && (
        <dl className="quote-doc__client">
          {clientFields.map((field) => (
            <div key={field.label} className={field.label === "Endereço" || field.label === "Local da instalação" ? "quote-doc__wide" : undefined}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {quote.description.trim() && (
        <>
          <h2 className="letterhead-doc__heading">Apresentação</h2>
          {quote.description
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </>
      )}

      {highlights.length > 0 && (
        <div className="quote-doc__highlights" style={{ gridTemplateColumns: `repeat(${highlights.length}, minmax(0, 1fr))` }}>
          {highlights.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      )}

      <h2 className="letterhead-doc__heading">Itens do orçamento</h2>
      <table className="quote-doc__items">
        <thead>
          <tr>
            <th>#</th>
            <th>Descrição</th>
            <th className="quote-doc__num">Qtd.</th>
            <th>Un.</th>
            <th className="quote-doc__num">Valor unit.</th>
            <th className="quote-doc__num">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td className="quote-doc__muted">{index + 1}</td>
              <td>{item.description}</td>
              <td className="quote-doc__num">{formatQuantity(item.quantity)}</td>
              <td className="quote-doc__muted">{item.unit}</td>
              <td className="quote-doc__num">{formatCurrency(item.unitPrice, true)}</td>
              <td className="quote-doc__num">{formatCurrency(itemTotal(item), true)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="quote-doc__totals">
        {discount > 0 && (
          <>
            <div>
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, true)}</span>
            </div>
            <div>
              <span>Desconto</span>
              <span>− {formatCurrency(discount, true)}</span>
            </div>
          </>
        )}
        <div className="quote-doc__grand-total">
          <span>Valor total</span>
          <strong>{formatCurrency(total, true)}</strong>
        </div>
        <p className="quote-doc__in-words">({currencyToWords(total)})</p>
      </div>

      {conditions.length > 0 && (
        <section className="quote-doc__keep">
          <h2 className="letterhead-doc__heading">Condições comerciais</h2>
          <dl className="quote-doc__conditions">
            {conditions.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {quote.notes.trim() && (
        <section className="quote-doc__keep">
          <h2 className="letterhead-doc__heading">Observações</h2>
          {quote.notes
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </section>
      )}

      <p className="quote-doc__closing">
        Ficamos à disposição para esclarecer qualquer dúvida e ajustar esta proposta às suas necessidades. Fale conosco pelo WhatsApp {siteConfig.contact.whatsappDisplay} ou pelo e-mail {siteConfig.contact.email}.
      </p>
    </LetterheadDocument>
  );
}
