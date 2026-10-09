import Image from "next/image";
import { siteConfig } from "@/config/site";
import emblem from "@/assets/brand/dc-emblem-dark.png";

/** Linha de serviços exibida no timbrado (cabeçalho e rodapé). */
const SERVICE_LINE = ["Energia Solar", "Carregadores Veiculares", "Eletropostos"];

function ServiceLine() {
  return (
    <span className="letterhead-doc__services">
      {SERVICE_LINE.map((item, index) => (
        <span key={item}>
          {index > 0 && <span className="letterhead-doc__sep">|</span>}
          {item}
        </span>
      ))}
    </span>
  );
}

function BrandName() {
  return (
    <span className="letterhead-doc__brand">
      {siteConfig.name.split(" ").map((word, index) => (
        <span key={`${word}-${index}`} className={word.toLowerCase() === "eco" ? "letterhead-doc__brand-eco" : undefined}>
          {index > 0 && " "}
          {index === 0 ? word : word.toLowerCase()}
        </span>
      ))}
    </span>
  );
}

/**
 * Folha A4 com o papel timbrado da empresa (orçamentos e contratos), pronta
 * para impressão / "Salvar como PDF". Na impressão, cabeçalho, rodapé e marca
 * d'água se repetem em todas as páginas (position: fixed) e o <thead>/<tfoot>
 * da tabela externa reserva o espaço deles em cada folha — ver
 * `.letterhead-doc` em globals.css.
 */
export function LetterheadDocument({ children }: { children: React.ReactNode }) {
  return (
    <article className="letterhead-doc">
      <header className="letterhead-doc__letterhead">
        <div className="letterhead-doc__letterhead-inner">
          <Image src={emblem} alt="" className="letterhead-doc__emblem" priority sizes="80px" />
          <div>
            <BrandName />
            <ServiceLine />
          </div>
          <div className="letterhead-doc__contact">
            <span>{siteConfig.contact.phoneDisplay}</span>
            <span>{siteConfig.contact.email}</span>
            <span>{siteConfig.url.replace(/^https?:\/\//, "")}</span>
          </div>
        </div>
      </header>
      <div className="letterhead-doc__watermark" aria-hidden="true">
        <Image src={emblem} alt="" priority sizes="400px" />
      </div>

      <table className="letterhead-doc__layout">
        <thead>
          <tr>
            <td>
              <div className="letterhead-doc__header-space" />
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="letterhead-doc__body">{children}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>
              <div className="letterhead-doc__footer-space" />
            </td>
          </tr>
        </tfoot>
      </table>

      <footer className="letterhead-doc__footer">
        <span>
          <strong>{siteConfig.name}</strong> · CNPJ {siteConfig.cnpj}
        </span>
        <ServiceLine />
      </footer>
    </article>
  );
}
