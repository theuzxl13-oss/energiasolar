import type { Project } from "@/types";
import { cn } from "@/lib/utils";

/**
 * "Imagem" generativa dos projetos demonstrativos: uma mini constelação de
 * triângulos vazados (mesma linguagem do hero), com figura por categoria.
 * Determinística (mesma semente → mesma imagem no servidor e no cliente).
 * Quando houver fotos reais, defina `project.image` e elas serão usadas no lugar.
 */

const PALETTE = ["#34d684", "#59b4ff", "#ffb829", "#15846e", "#22d3ee", "#a3e635", "#8ed0ff"];

type Figure = (x: number, y: number) => number; // retorna densidade 0–1

const insidePolygon = (points: [number, number][], x: number, y: number) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]!;
    const [xj, yj] = points[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const FIGURES: Record<Project["art"], Figure> = {
  "solar-home": (x, y) => (Math.hypot(x - 50, y - 50) < 22 ? 1 : Math.abs(Math.hypot(x - 50, y - 50) - 34) < 3 ? 0.5 : 0),
  "solar-commercial": (x, y) => {
    const row = Math.floor((y - 26) / 16);
    return y > 26 && y < 76 && x > 14 && x < 86 && (y - 26) % 16 < 11 && row >= 0 ? 0.9 : 0;
  },
  "solar-industrial": (x, y) => (y > 30 && y < 74 && x > 8 && x < 92 && (x - 8) % 14 < 11 && (y - 30) % 15 < 11 ? 0.85 : 0),
  wallbox: (x, y) => (Math.abs(Math.hypot(x - 50, y - 46) - 22) < 4 ? 1 : Math.hypot(x - 50, y - 46) < 7 ? 1 : 0),
  condo: (x, y) => ([22, 42, 62, 82].some((cx) => Math.abs(x - cx) < 5 && y > 28 && y < 72) ? 0.9 : 0),
  station: (x, y) =>
    insidePolygon([[57, 10], [32, 52], [48, 52], [42, 90], [70, 44], [54, 44], [64, 10]], x, y) ? 1 : 0,
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number) => Math.round(value * 100) / 100;

function buildTriangles(art: Project["art"]) {
  const rand = mulberry32(art.split("").reduce((acc, char) => acc * 31 + char.charCodeAt(0), 7));
  const figure = FIGURES[art];
  const triangles: { points: string; color: string; opacity: number }[] = [];
  let tries = 0;
  while (triangles.length < 420 && tries < 20000) {
    tries += 1;
    const x = rand() * 100;
    const y = rand() * 100;
    const density = figure(x, y);
    const ambient = density === 0 && rand() < 0.012;
    if (!ambient && rand() > density) continue;
    const size = 0.7 + rand() * 1.1;
    const rotation = rand() * Math.PI * 2;
    const points = [0, 1, 2]
      .map((vertex) => {
        const angle = rotation + (vertex * 2 * Math.PI) / 3;
        return `${round(x + 30 + Math.cos(angle) * size)},${round(y + Math.sin(angle) * size)}`;
      })
      .join(" ");
    triangles.push({ points, color: PALETTE[Math.floor(rand() * PALETTE.length)]!, opacity: ambient ? 0.35 : round(0.55 + rand() * 0.45) });
  }
  return triangles;
}

export function ProjectArt({ art, className }: { art: Project["art"]; className?: string }) {
  const triangles = buildTriangles(art);
  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      <svg viewBox="0 0 160 100" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {triangles.map((triangle, index) => (
          <polygon key={index} points={triangle.points} fill="none" stroke={triangle.color} strokeWidth="0.3" opacity={triangle.opacity} />
        ))}
      </svg>
    </div>
  );
}
