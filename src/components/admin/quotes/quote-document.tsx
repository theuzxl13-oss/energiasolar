import { currencyToWords, formatIsoDate, lineTotal, quoteTotals, type Quote, type QuoteItem } from "@/lib/quotes";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DOC_GREEN as GREEN, DOC_NAVY as NAVY, LetterheadPage as Page } from "../documents/letterhead-page";

/**
 * Documento do orçamento em páginas A4 sobre a folha timbrada.
 * Itens que não cabem na 1ª página continuam nas seguintes; as condições
 * comerciais ficam sempre na última página.
 */

/** Quantos itens cabem em cada página (1ª página tem cliente e apresentação). */
const FIRST_PAGE_ITEMS = 8;
const NEXT_PAGE_ITEMS = 20;

function chunkItems(items: QuoteItem[]) {
  const chunks: QuoteItem[][] = [items.slice(0, FIRST_PAGE_ITEMS)];
  for (let start = FIRST_PAGE_ITEMS; start < items.length; start += NEXT_PAGE_ITEMS) chunks.push(items.slice(start, start + NEXT_PAGE_ITEMS));
  return chunks;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-[2mm] text-[8pt] font-semibold tracking-[0.12em] uppercase" style={{ color: GREEN }}>
      {children}
    </h3>
  );
}

function Labeled({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[6.5pt] font-semibold tracking-[0.1em] text-[#6b7280] uppercase">{label}</p>
      <p className="mt-[0.5mm] text-[9pt] leading-snug" style={{ color: NAVY }}>
        {value || "—"}
      </p>
    </div>
  );
}

function ItemsTable({ items, startIndex }: { items: QuoteItem[]; startIndex: number }) {
  return (
    <table className="w-full border-collapse text-[8.5pt]">
      <thead>
        <tr className="text-left text-[6.5pt] tracking-[0.08em] text-white uppercase" style={{ background: NAVY }}>
          <th className="w-[7mm] px-[2mm] py-[1.6mm] font-semibold">#</th>
          <th className="px-[2mm] py-[1.6mm] font-semibold">Descrição</th>
          <th className="w-[13mm] px-[2mm] py-[1.6mm] text-right font-semibold">Qtd.</th>
          <th className="w-[11mm] px-[2mm] py-[1.6mm] font-semibold">Un.</th>
          <th className="w-[27mm] px-[2mm] py-[1.6mm] text-right font-semibold">Valor unit.</th>
          <th className="w-[28mm] px-[2mm] py-[1.6mm] text-right font-semibold">Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={item.id} className="border-b border-[#e5e7eb] align-top" style={{ background: index % 2 ? "#f8fafc" : "transparent" }}>
            <td className="px-[2mm] py-[1.6mm] text-[#6b7280]">{startIndex + index + 1}</td>
            <td className="px-[2mm] py-[1.6mm]" style={{ color: NAVY }}>
              {item.description}
            </td>
            <td className="px-[2mm] py-[1.6mm] text-right">{formatNumber(item.quantity, 2)}</td>
            <td className="px-[2mm] py-[1.6mm]">{item.unit}</td>
            <td className="px-[2mm] py-[1.6mm] text-right whitespace-nowrap">{formatCurrency(item.unitPrice, true)}</td>
            <td className="px-[2mm] py-[1.6mm] text-right font-semibold whitespace-nowrap" style={{ color: NAVY }}>
              {formatCurrency(lineTotal(item), true)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Totals({ quote }: { quote: Quote }) {
  const { subtotal, discount, total } = quoteTotals(quote);
  return (
    <div className="mt-[3mm] ml-auto w-[78mm] text-[9pt]">
      <div className="flex justify-between py-[0.8mm]">
        <span className="text-[#6b7280]">Subtotal</span>
        <span>{formatCurrency(subtotal, true)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between py-[0.8mm]">
          <span className="text-[#6b7280]">Desconto</span>
          <span>− {formatCurrency(discount, true)}</span>
        </div>
      )}
      <div className="mt-[1mm] flex items-center justify-between rounded-[1.5mm] px-[3mm] py-[2mm] text-white" style={{ background: GREEN }}>
        <span className="text-[8pt] font-semibold tracking-[0.1em] uppercase">Valor total</span>
        <span className="text-[12pt] font-bold">{formatCurrency(total, true)}</span>
      </div>
      <p className="mt-[1mm] text-right text-[7.5pt] text-[#6b7280] italic">({currencyToWords(total)})</p>
    </div>
  );
}

function Conditions({ quote }: { quote: Quote }) {
  const rows: [string, string][] = [
    ["Forma de pagamento", quote.conditions.payment],
    ["Prazo de execução", quote.conditions.deadline],
    ["Validade da proposta", quote.conditions.validity],
    ["Garantia", quote.conditions.warranty],
    ["Observações", quote.conditions.notes],
  ];
  return (
    <div>
      <h2 className="text-[15pt] font-bold tracking-[-0.01em]" style={{ color: NAVY }}>
        Condições comerciais
      </h2>
      <div className="mt-[2mm] h-[0.6mm] w-[22mm]" style={{ background: GREEN }} />
      <dl className="mt-[6mm] space-y-[5mm]">
        {rows
          .filter(([, value]) => value.trim())
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-[7.5pt] font-semibold tracking-[0.12em] uppercase" style={{ color: GREEN }}>
                {label}
              </dt>
              <dd className="mt-[1mm] text-[9.5pt] leading-relaxed whitespace-pre-line text-[#374151]">{value}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

export function QuoteDocument({ quote, contactLine }: { quote: Quote; contactLine: string }) {
  const chunks = chunkItems(quote.items);
  const totalPages = chunks.length + 1; // páginas de itens + página de condições
  const highlights: [string, string][] = [
    ["Potência do sistema", quote.highlights.power],
    ["Geração estimada", quote.highlights.generation],
    ["Economia estimada", quote.highlights.savings],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()));

  return (
    <div className="quote-document space-y-8 print:space-y-0">
      {chunks.map((items, chunkIndex) => {
        const isFirst = chunkIndex === 0;
        const isLastItems = chunkIndex === chunks.length - 1;
        const startIndex = isFirst ? 0 : FIRST_PAGE_ITEMS + (chunkIndex - 1) * NEXT_PAGE_ITEMS;
        return (
          <Page key={chunkIndex} pageNumber={chunkIndex + 1} totalPages={totalPages}>
            {isFirst ? (
              <>
                {/* Cabeçalho do orçamento */}
                <div className="flex items-end justify-between gap-[6mm]">
                  <div>
                    <p className="text-[8pt] font-semibold tracking-[0.3em] uppercase" style={{ color: GREEN }}>
                      Orçamento
                    </p>
                    <h1 className="mt-[1mm] text-[15pt] leading-tight font-bold" style={{ color: NAVY }}>
                      {quote.title}
                    </h1>
                  </div>
                  <div className="flex shrink-0 gap-[5mm] text-right">
                    <Labeled label="Nº" value={quote.number} />
                    <Labeled label="Emissão" value={formatIsoDate(quote.issueDate)} />
                    <Labeled label="Validade" value={formatIsoDate(quote.validUntil)} />
                  </div>
                </div>

                {/* Cliente */}
                <div className="mt-[5mm] grid grid-cols-2 gap-x-[6mm] gap-y-[2.5mm] rounded-[2mm] border border-[#e5e7eb] bg-white/80 p-[4mm]">
                  <Labeled label="Cliente" value={quote.client.name} />
                  <Labeled label="Telefone" value={quote.client.phone} />
                  <Labeled label="E-mail" value={quote.client.email} className="col-span-2" />
                  <Labeled label="Endereço" value={quote.client.address} className="col-span-2" />
                  <Labeled label="Local da instalação" value={quote.client.installationAddress} className="col-span-2" />
                </div>

                {/* Apresentação */}
                {quote.presentation.trim() && (
                  <div className="mt-[5mm]">
                    <SectionTitle>Apresentação</SectionTitle>
                    <p className="text-[9pt] leading-relaxed whitespace-pre-line text-[#374151]">{quote.presentation}</p>
                  </div>
                )}

                {/* Destaques */}
                {highlights.length > 0 && (
                  <div className="mt-[4mm] grid gap-[3mm]" style={{ gridTemplateColumns: `repeat(${highlights.length}, minmax(0, 1fr))` }}>
                    {highlights.map(([label, value]) => (
                      <div key={label} className="rounded-[2mm] px-[3mm] py-[2.5mm]" style={{ background: "#eef6f1", borderLeft: `0.8mm solid ${GREEN}` }}>
                        <p className="text-[6.5pt] font-semibold tracking-[0.1em] text-[#6b7280] uppercase">{label}</p>
                        <p className="mt-[0.5mm] text-[12pt] font-bold" style={{ color: NAVY }}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-[5mm]">
                  <SectionTitle>Itens do orçamento</SectionTitle>
                  <ItemsTable items={items} startIndex={0} />
                </div>
              </>
            ) : (
              <div>
                <SectionTitle>Itens do orçamento (continuação)</SectionTitle>
                <ItemsTable items={items} startIndex={startIndex} />
              </div>
            )}
            {isLastItems && <Totals quote={quote} />}
          </Page>
        );
      })}

      <Page pageNumber={totalPages} totalPages={totalPages}>
        <Conditions quote={quote} />
        <p className="mt-[8mm] text-[9pt] leading-relaxed text-[#374151]">
          Ficamos à disposição para esclarecer qualquer dúvida e ajustar esta proposta às suas necessidades. {contactLine}
        </p>
        <div className="mt-[16mm] grid grid-cols-2 gap-[12mm] text-center text-[8pt] text-[#6b7280]">
          <div>
            <div className="mb-[1.5mm] border-t border-[#9ca3af]" />
            DC eco energy
          </div>
          <div>
            <div className="mb-[1.5mm] border-t border-[#9ca3af]" />
            De acordo — {quote.client.name || "Cliente"}
          </div>
        </div>
      </Page>
    </div>
  );
}
