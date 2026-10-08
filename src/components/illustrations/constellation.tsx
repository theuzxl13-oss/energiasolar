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
 * animação pausada fora da tela e desativada com `prefers-reduced-motion`.
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
}

export function Constellation({ shape = "bolt", className, density = 1400, ambient = 140, label }: ConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999 };
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let start = performance.now();

    function build() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rand = mulberry32(shape.length * 7919 + 17);
      const count = Math.round(Math.min(density, (width * height) / 110));
      const targets = sampleTargets(shape, width, height, count, rand);
      const makeParticle = (tx: number, ty: number, isAmbient: boolean): Particle => ({
        tx,
        ty,
        x: reduceMotion ? tx : width / 2 + (rand() - 0.5) * width * 1.4,
        y: reduceMotion ? ty : height / 2 + (rand() - 0.5) * height * 1.4,
        size: isAmbient ? 2 + rand() * 3 : 1.6 + rand() * 3.4,
        rot: rand() * Math.PI * 2,
        spin: (rand() - 0.5) * 0.02,
        color: PALETTE[Math.floor(rand() * PALETTE.length)]!,
        phase: rand() * Math.PI * 2,
        amp: isAmbient ? 6 + rand() * 14 : 0.6 + rand() * 2.4,
        alpha: isAmbient ? 0.18 + rand() * 0.3 : 0.55 + rand() * 0.45,
      });
      particles = [
        ...targets.map(([x, y]) => makeParticle(x, y, false)),
        ...Array.from({ length: Math.round((ambient * width) / 700) }, () => makeParticle(rand() * width, rand() * height, true)),
      ];
      start = performance.now();
    }

    function draw(now: number) {
      const t = (now - start) / 1000;
      ctx!.clearRect(0, 0, width, height);
      ctx!.lineWidth = 1;
      for (const particle of particles) {
        if (!reduceMotion) {
          const ox = Math.sin(t * 0.8 + particle.phase) * particle.amp;
          const oy = Math.cos(t * 0.6 + particle.phase * 1.3) * particle.amp;
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
          particle.rot += particle.spin;
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
      if (visible && !reduceMotion) frame = requestAnimationFrame(loop);
    }

    build();
    if (reduceMotion) draw(performance.now());
    else frame = requestAnimationFrame(loop);

    const resizeObserver = new ResizeObserver(() => {
      build();
      if (reduceMotion) draw(performance.now());
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      const wasVisible = visible;
      visible = Boolean(entry?.isIntersecting);
      if (visible && !wasVisible && !reduceMotion) frame = requestAnimationFrame(loop);
      if (!visible) cancelAnimationFrame(frame);
    });
    intersectionObserver.observe(canvas);

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [shape, density, ambient]);

  return <canvas ref={canvasRef} className={cn("block size-full", className)} role="img" aria-label={label ?? "Constelação de partículas de energia"} />;
}
