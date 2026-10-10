/* eslint-disable @next/next/no-img-element */

/**
 * Página A4 com a folha timbrada da empresa (orçamentos, contratos…).
 * - A folha é uma <img> (e não background-image) para sair na impressão
 *   mesmo com "gráficos de plano de fundo" desativado no navegador.
 * - Medidas em milímetros para o PDF sair idêntico à tela.
 * - Para trocar a folha, substitua public/brand/folha-timbrada.jpg (A4, retrato).
 */

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const LETTERHEAD_SRC = `${BASE_PATH}/brand/folha-timbrada.jpg`;

/** Cores da identidade usadas nos documentos. */
export const DOC_NAVY = "#0a3460";
export const DOC_GREEN = "#069854";

/** Área útil entre o cabeçalho e o rodapé da folha timbrada (mm). */
export const CONTENT_AREA = { top: 44, bottom: 31, left: 16, right: 16 } as const;
/** Altura útil para conteúdo (descontando a linha "Página X de Y"). */
export const CONTENT_HEIGHT_MM = 297 - CONTENT_AREA.top - CONTENT_AREA.bottom - 7;
export const CONTENT_WIDTH_MM = 210 - CONTENT_AREA.left - CONTENT_AREA.right;

export function LetterheadPage({ children, pageNumber, totalPages }: { children: React.ReactNode; pageNumber: number; totalPages: number }) {
  return (
    <section className="quote-page relative mx-auto overflow-hidden bg-white text-[#1f2937] shadow-xl print:shadow-none" style={{ width: "210mm", height: "297mm" }}>
      <img src={LETTERHEAD_SRC} alt="" className="pointer-events-none absolute inset-0 size-full select-none" />
      <div
        className="absolute flex flex-col"
        style={{ top: `${CONTENT_AREA.top}mm`, bottom: `${CONTENT_AREA.bottom}mm`, left: `${CONTENT_AREA.left}mm`, right: `${CONTENT_AREA.right}mm` }}
      >
        <div className="min-h-0 flex-1">{children}</div>
        <p className="pt-2 text-right text-[7.5pt] text-[#6b7280]">
          Página {pageNumber} de {totalPages}
        </p>
      </div>
    </section>
  );
}
