import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.slogan}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Gerada no build (compatível também com exportação estática). */
export const dynamic = "force-static";

/** Imagem Open Graph (compartilhamento em WhatsApp, redes sociais etc.). */
export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "src/assets/brand/dc-eco-energy-dark.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
          background: "#000000",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={440} height={307} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 480 }}>
          <span style={{ fontSize: 56, lineHeight: 1.05, letterSpacing: -2 }}>Energia inteligente para um futuro sustentável.</span>
          <span style={{ fontSize: 24, color: "#bdbdbd" }}>Energia solar · Carregadores veiculares · Eletropostos</span>
        </div>
      </div>
    ),
    size,
  );
}
