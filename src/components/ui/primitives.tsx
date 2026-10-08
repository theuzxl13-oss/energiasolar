import { cn } from "@/lib/utils";

/*
 * Primitivos de layout. Todas as seções ficam sobre o preto puro:
 * hierarquia por escala tipográfica e espaço — sem painéis, cards ou sombras.
 */

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10", className)}>{children}</div>;
}

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Mantido por compatibilidade; todas as seções usam o mesmo fundo. */
  tone?: "light" | "muted" | "dark";
}

export function Section({ tone: _tone, className, children, ...props }: SectionProps) {
  return (
    <section className={cn("relative py-20 sm:py-24 lg:py-30", className)} {...props}>
      {children}
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** "split": título à esquerda e texto à direita (padrão do site). */
  align?: "left" | "center" | "split";
  tone?: "light" | "dark";
  size?: "display" | "headline" | "title";
  className?: string;
  as?: "h1" | "h2";
}

export function SectionHeading({ eyebrow, title, description, align = "split", size = "headline", className, as: Tag = "h2" }: SectionHeadingProps) {
  const titleClass = size === "display" ? "text-display" : size === "title" ? "text-title" : "text-headline";

  if (align === "split") {
    return (
      <div className={cn("grid gap-8 lg:grid-cols-12 lg:gap-12", className)}>
        <Tag className={cn(titleClass, "text-white lg:col-span-7")}>{title}</Tag>
        {(eyebrow || description) && (
          <div className="lg:col-span-5 lg:pt-4">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {description && <p className="mt-4 max-w-md text-lead text-mist">{description}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("max-w-4xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Tag className={cn(titleClass, "mt-5 text-white")}>{title}</Tag>
      {description && <p className={cn("mt-6 max-w-xl text-lead text-mist", align === "center" && "mx-auto")}>{description}</p>}
    </div>
  );
}

/** Rótulo em caixa alta âmbar acima de textos. */
export function Eyebrow({ children, className }: { children: React.ReactNode; tone?: "light" | "dark"; className?: string }) {
  return <p className={cn("label-caps text-spark", className)}>{children}</p>;
}

/** Selo para identificar conteúdo demonstrativo. */
export function DemoBadge({ label = "Dado demonstrativo", tone = "dark", className }: { label?: string; tone?: "light" | "dark"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-normal",
        // "dark": sobre o preto do site; "light": sobre o fundo claro do painel administrativo.
        tone === "dark" ? "border-spark/40 text-spark" : "border-amber-300 bg-amber-50 text-amber-800",
        className,
      )}
    >
      <span className={cn("size-1 rounded-full", tone === "dark" ? "bg-spark" : "bg-amber-600")} aria-hidden="true" />
      {label}
    </span>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("label-caps inline-flex items-center gap-1.5 text-ash", className)}>{children}</span>;
}

/** Linha fina usada para separar itens de listas tipográficas. */
export function Hairline({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-white/10", className)} />;
}
