"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { CONTENT_HEIGHT_MM, CONTENT_WIDTH_MM, LetterheadPage } from "./letterhead-page";

export interface DocumentBlock {
  key: string;
  node: React.ReactNode;
  /** Mantém este bloco na mesma página do seguinte (ex.: título de seção). */
  keepWithNext?: boolean;
}

const MM_TO_PX = 96 / 25.4;

/**
 * Distribui blocos de conteúdo em páginas A4 com a folha timbrada.
 * Mede a altura real de cada bloco (cópia invisível com a mesma largura)
 * e preenche as páginas sem quebrar blocos ao meio.
 * `version` deve mudar sempre que o conteúdo mudar, para refazer a paginação.
 */
export function PaginatedLetterhead({ blocks, version }: { blocks: DocumentBlock[]; version: string }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][]>([blocks.map((_, index) => index)]);

  useLayoutEffect(() => {
    const container = measureRef.current;
    if (!container) return;

    const paginate = () => {
      // 1º filho = régua com a altura útil da página, medida no mesmo contexto (zoom) dos blocos.
      const [ruler, ...items] = Array.from(container.children) as HTMLElement[];
      const heights = items.map((child) => child.getBoundingClientRect().height);
      const available = ruler?.getBoundingClientRect().height || CONTENT_HEIGHT_MM * MM_TO_PX;
      const result: number[][] = [];
      let current: number[] = [];
      let used = 0;

      for (let index = 0; index < heights.length; index += 1) {
        const height = heights[index] ?? 0;
        // Título de seção: precisa caber junto com o bloco seguinte.
        const needed = blocks[index]?.keepWithNext ? height + (heights[index + 1] ?? 0) : height;
        if (current.length && used + needed > available) {
          result.push(current);
          current = [];
          used = 0;
        }
        current.push(index);
        used += height;
      }
      if (current.length) result.push(current);
      setPages(result);
    };

    paginate();
    // Refaz quando as fontes terminam de carregar (alturas podem mudar).
    document.fonts?.ready.then(paginate).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return (
    <>
      {/* Cópia invisível usada só para medir as alturas */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-[-10000px] invisible text-[#1f2937] print:hidden"
        style={{ width: `${CONTENT_WIDTH_MM}mm` }}
      >
        <div style={{ height: `${CONTENT_HEIGHT_MM}mm` }} />
        {blocks.map((block) => (
          <div key={block.key}>{block.node}</div>
        ))}
      </div>

      <div className="quote-document space-y-8 print:space-y-0">
        {pages.map((indexes, pageIndex) => (
          <LetterheadPage key={pageIndex} pageNumber={pageIndex + 1} totalPages={pages.length}>
            {indexes.map((index) => (
              <div key={blocks[index]?.key ?? index}>{blocks[index]?.node}</div>
            ))}
          </LetterheadPage>
        ))}
      </div>
    </>
  );
}
