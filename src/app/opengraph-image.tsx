import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — Energia Solar e Mobilidade Elétrica`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Gerada no build (compatível também com exportação estática). */
export const dynamic = "force-static";

/** Imagem Open Graph (compartilhamento em redes sociais). */

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #040a13 0%, #0d1b2c 55%, #0b4e31 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(135deg, #34d684, #3393fc)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
            }}
          >
            ⚡
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 36, fontWeight: 700 }}>{siteConfig.name}</span>
            <span style={{ fontSize: 22, color: "#94a3b8" }}>{siteConfig.tagline}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>Energia inteligente para um futuro sustentável.</span>
          <span style={{ fontSize: 28, color: "#cbd5e1" }}>Energia solar • Carregadores veiculares • Eletropostos</span>
        </div>
      </div>
    ),
    size,
  );
}
