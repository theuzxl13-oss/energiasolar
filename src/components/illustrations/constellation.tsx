"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Constelação de partículas — imagem-assinatura da marca.
 * Milhares de pequenos triângulos vazados, em cores de energia, formam uma
 * figura (raio, sol ou conector veicular) e respiram suavemente; o ponteiro
 * do mouse afasta as partículas próximas. Partículas soltas criam
 * profundidade ao redor.
 *
 * Desempenho: canvas 2D, DPR limitado a 2, quantidade proporcional à área,
 * animação pausada fora da tela. Com `prefers-reduced-motion` (ex.: "Efeitos de animação"
 * desligado no Windows) o movimento fica mais suave — sem a entrada inicial e com balanço
 * menor — mas as partículas continuam vivas e reagindo ao cursor/toque.
 */

export type ConstellationShape = "bolt" | "sun" | "plug";

const PALETTE = ["#34d684", "#34d684", "#59b4ff", "#59b4ff", "#ffb829", "#15846e", "#22d3ee", "#a3e635", "#8ed0ff", "#6deaa6"];

interface Particle {
  tx: number;
  ty: number;
  x: number;
  y: number;
  size: number;
  rot: number;
  spin: number;
  color: string;
  phase: number;
  amp: number;
  alpha: number;
}

/** Desenha a figura em coordenadas normalizadas 0–100. Opacidade = densidade de partículas. */
function drawShape(ctx: CanvasRenderingContext2D, shape: ConstellationShape) {
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";

  if (shape === "bolt") {
    ctx.globalAlpha = 1;
    ctx.beginPath();
    const bolt: [number, number][] = [[61, 2], [20, 57], [45, 57], [35, 98], [81, 40], [55, 40], [69, 2]];
    bolt.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(50, 50, 46, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (shape === "sun") {
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(50, 50, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 4.5;
    for (let index = 0; index < 12; index += 1) {
      const angle = (index * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(50 + Math.cos(angle) * 32, 50 + Math.sin(angle) * 32);
      ctx.lineTo(50 + Math.cos(angle) * 45, 50 + Math.sin(angle) * 45);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(50, 50, 49, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (shape === "plug") {
    // Face do conector (Tipo 2) com pinos e cabo.
    ctx.globalAlpha = 1;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(50, 40, 30, Math.PI * 0.95, Math.PI * 2.05);
    ctx.lineTo(70, 66);
    ctx.lineTo(30, 66);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    const pins: [number, number, number][] = [[38, 34, 5], [62, 34, 5], [50, 30, 4], [42, 50, 6], [58, 50, 6]];
    for (const [x, y, r] of pins) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(50, 68);
    ctx.bezierCurveTo(50, 84, 70, 82, 76, 98);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function sampleTargets(shape: ConstellationShape, width: number, height: number, count: number, rand: () => number) {
  const side = Math.min(width, height) * 0.92;
  const offsetX = (width - side) / 2;
  const offsetY = (height - side) / 2;
  const res = 200;
  const off = document.createElement("canvas");
  off.width = res;
  off.height = res;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.scale(res / 100, res / 100);
  drawShape(ctx, shape);
  const data = ctx.getImageData(0, 0, res, res).data;

  const points: [number, number][] = [];
  let tries = 0;
  while (points.length < count && tries < count * 60) {
    tries += 1;
    const px = Math.floor(rand() * res);
    const py = Math.floor(rand() * res);
    const alpha = data[(py * res + px) * 4 + 3]! / 255;
    if (alpha > 0 && rand() < alpha) {
      points.push([offsetX + ((px + rand()) / res) * side, offsetY + ((py + rand()) / res) * side]);
    }
  }
  return points;
}

/**
 * Tema claro: paleta do logotipo para fundo claro (azul-marinho do texto,
 * verde da marca e âmbar do sol), em vez das cores "neon" do tema escuro.
 */
const LIGHT_TONES = {
  navy: ["#0a3460", "#1e4f8a"],
  green: ["#069854", "#0b5f39"],
  amber: ["#d97706", "#b45309"],
} as const;
const PALETTE_LIGHT = ["#0a3460", "#0a3460", "#1e4f8a", "#069854", "#069854", "#d97706"];

const isLightTheme = () => document.documentElement.dataset.theme === "light";

/**
 * Cor da partícula a partir do pixel do logo:
 * - escuro: mantém a cor original, clareando tons apagados;
 * - claro: converte para o tom de marca mais próximo (verde, âmbar ou azul-marinho).
 */
function particleColor(r: number, g: number, b: number, light: boolean) {
  const max = Math.max(r, g, b, 1);
  if (!light) {
    const factor = max < 170 ? 170 / max : 1;
    return `rgb(${Math.min(255, Math.round(r * factor))},${Math.min(255, Math.round(g * factor))},${Math.min(255, Math.round(b * factor))})`;
  }
  const bright = max > 150 ? 0 : 1;
  if (g > r + 15 && g > b) return LIGHT_TONES.green[bright]!;
  if (r > b + 40 && g > b + 10) return LIGHT_TONES.amber[bright]!;
  return LIGHT_TONES.navy[bright]!;
}

/**
 * Amostra pontos a partir de uma imagem (ex.: emblema da marca): a forma vem
 * da transparência e a cor de cada partícula vem do pixel correspondente.
 */
function sampleImage(image: HTMLImageElement, width: number, height: number, count: number, rand: () => number, light: boolean) {
  const side = Math.min(width, height) * 0.9;
  const scale = Math.min(side / image.naturalWidth, side / image.naturalHeight);
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const offsetX = (width - drawW) / 2;
  const offsetY = (height - drawH) / 2;

  const resW = Math.min(image.naturalWidth, 400);
  const resH = Math.round((resW * image.naturalHeight) / image.naturalWidth);
  const off = document.createElement("canvas");
  off.width = resW;
  off.height = resH;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(image, 0, 0, resW, resH);
  const data = ctx.getImageData(0, 0, resW, resH).data;

  const points: [number, number, string][] = [];
  let tries = 0;
  while (points.length < count && tries < count * 80) {
    tries += 1;
    const px = Math.floor(rand() * resW);
    const py = Math.floor(rand() * resH);
    const index = (py * resW + px) * 4;
    const alpha = data[index + 3]! / 255;
    if (alpha > 0.5 && rand() < alpha) {
      points.push([
        offsetX + ((px + rand()) / resW) * drawW,
        offsetY + ((py + rand()) / resH) * drawH,
        particleColor(data[index]!, data[index + 1]!, data[index + 2]!, light),
      ]);
    }
  }
  return points;
}

/** Gerador pseudoaleatório determinístico (mesma figura a cada carregamento). */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

interface ConstellationProps {
  shape?: ConstellationShape;
  className?: string;
  /** Quantidade máxima de partículas da figura. */
  density?: number;
  /** Quantidade de partículas ambientes soltas. */
  ambient?: number;
  label?: string;
  /** URL de uma imagem com fundo transparente (ex.: logo). Quando definida, substitui `shape` e usa as cores da imagem. */
  image?: string;
}

export function Constellation({ shape = "bolt", className, density = 1400, ambient = 140, label, image }: ConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /** Intensidade do balanço: menor para quem prefere menos movimento. */
    const drift = reduceMotion ? 0.4 : 1;
    const pointer = { x: -9999, y: -9999 };
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let start = performance.now();
    let logoImage: HTMLImageElement | null = null;
    let lineWidth = 1;
    let cancelled = false;

    function build() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      if (image && !logoImage) return; // aguarda o carregamento da imagem
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rand = mulberry32(shape.length * 7919 + 17);
      const light = isLightTheme();
      const palette = light ? PALETTE_LIGHT : PALETTE;
      const count = Math.round(Math.min(density, (width * height) / 110));
      const targets: [number, number, string | null][] = logoImage
        ? sampleImage(logoImage, width, height, count, rand, light)
        : sampleTargets(shape, width, height, count, rand).map(([x, y]) => [x, y, null]);
      const makeParticle = (tx: number, ty: number, isAmbient: boolean, color: string | null = null): Particle => ({
        tx,
        ty,
        x: reduceMotion ? tx : width / 2 + (rand() - 0.5) * width * 1.4,
        y: reduceMotion ? ty : height / 2 + (rand() - 0.5) * height * 1.4,
        size: isAmbient ? 2 + rand() * 3 : 1.6 + rand() * 3.4,
        rot: rand() * Math.PI * 2,
        spin: (rand() - 0.5) * 0.02,
        color: color ?? palette[Math.floor(rand() * palette.length)]!,
        phase: rand() * Math.PI * 2,
        amp: isAmbient ? 6 + rand() * 14 : 0.6 + rand() * 2.4,
        // No claro, partículas soltas mais discretas e figura com mais presença.
        alpha: isAmbient ? (light ? 0.12 + rand() * 0.18 : 0.18 + rand() * 0.3) : light ? 0.7 + rand() * 0.3 : 0.55 + rand() * 0.45,
      });
      lineWidth = light ? 1.25 : 1;
      const ambientCount = Math.round(((light ? ambient * 0.5 : ambient) * width) / 700);
      particles = [
        ...targets.map(([x, y, color]) => makeParticle(x, y, false, color)),
        ...Array.from({ length: ambientCount }, () => makeParticle(rand() * width, rand() * height, true)),
      ];
      start = performance.now();
    }

    function draw(now: number) {
      const t = (now - start) / 1000;
      ctx!.clearRect(0, 0, width, height);
      ctx!.lineWidth = lineWidth;
      for (const particle of particles) {
        {
          const ox = Math.sin(t * 0.8 + particle.phase) * particle.amp * drift;
          const oy = Math.cos(t * 0.6 + particle.phase * 1.3) * particle.amp * drift;
          let gx = particle.tx + ox;
          let gy = particle.ty + oy;
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 90 && distance > 0.01) {
            const force = (90 - distance) / 90;
            gx += (dx / distance) * force * 46;
            gy += (dy / distance) * force * 46;
          }
          particle.x += (gx - particle.x) * 0.055;
          particle.y += (gy - particle.y) * 0.055;
          particle.rot += particle.spin * drift;
        }
        const s = particle.size;
        const cos = Math.cos(particle.rot);
        const sin = Math.sin(particle.rot);
        ctx!.globalAlpha = particle.alpha;
        ctx!.strokeStyle = particle.color;
        ctx!.beginPath();
        for (let vertex = 0; vertex < 3; vertex += 1) {
          const angle = (vertex * 2 * Math.PI) / 3;
          const vx = Math.cos(angle) * s;
          const vy = Math.sin(angle) * s;
          const px = particle.x + vx * cos - vy * sin;
          const py = particle.y + vx * sin + vy * cos;
          if (vertex === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        }
        ctx!.closePath();
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;
    }

    function loop(now: number) {
      draw(now);
      if (visible) frame = requestAnimationFrame(loop);
    }

    function begin() {
      build();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(loop);
    }

    if (image) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (cancelled) return;
        logoImage = img;
        begin();
      };
      img.src = image;
    } else {
      begin();
    }

    const resizeObserver = new ResizeObserver(() => build());
    resizeObserver.observe(canvas);

    // Recria as partículas com as cores do tema quando o visitante troca claro/escuro.
    const themeObserver = new MutationObserver(() => build());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      const wasVisible = visible;
      visible = Boolean(entry?.isIntersecting);
      if (visible && !wasVisible) {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(loop);
      }
      if (!visible) cancelAnimationFrame(frame);
    });
    intersectionObserver.observe(canvas);

    const setPointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
    };
    const onMove = (event: PointerEvent) => setPointer(event.clientX, event.clientY);
    // Toque: acompanha o dedo mesmo enquanto a página rola (pointermove é cancelado na rolagem).
    const onTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) setPointer(touch.clientX, touch.clientY);
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onLeave, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onLeave);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [shape, density, ambient, image]);

  return <canvas ref={canvasRef} className={cn("block size-full", className)} role="img" aria-label={label ?? "Constelação de partículas de energia"} />;
}
