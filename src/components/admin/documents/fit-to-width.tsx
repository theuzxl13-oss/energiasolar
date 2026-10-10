"use client";

import { useEffect, useRef, useState } from "react";

/** Largura de uma folha A4 (210 mm) em pixels CSS. */
const A4_WIDTH_PX = 794;

/**
 * Reduz a visualização das folhas A4 para caber em telas estreitas.
 * Afeta só a tela — na impressão/PDF o zoom volta a 100%.
 */
export function FitToWidth({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? A4_WIDTH_PX;
      setScale(Math.min(1, width / (A4_WIDTH_PX + 8)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="pb-6 print:pb-0">
      {/* "!" = !important, para vencer o zoom inline na impressão */}
      <div className="print:[zoom:1]!" style={{ zoom: scale }}>
        {children}
      </div>
    </div>
  );
}
