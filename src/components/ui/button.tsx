import Link from "next/link";
import { forwardRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sistema de botões:
 * - `primary`: pílula verde preenchida — a ÚNICA ação principal por vista.
 * - demais variantes: links "fantasma" em caixa alta, sem contêiner.
 * Os nomes antigos (secondary, outline, light, whatsapp) são mantidos por
 * compatibilidade e renderizam como ação fantasma.
 */
type Variant = "primary" | "secondary" | "outline" | "ghost" | "light" | "whatsapp";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.025em] whitespace-nowrap transition-all duration-300 disabled:pointer-events-none disabled:opacity-50";

const pillSizes: Record<Size, string> = {
  sm: "h-10 rounded-3xl px-5 text-[13px]",
  md: "h-11 rounded-3xl px-6 text-sm",
  lg: "h-12 rounded-3xl px-7 text-sm",
};

function isPrimary(variant: Variant) {
  return variant === "primary";
}

export function buttonStyles({ variant = "primary", size = "md", className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  if (isPrimary(variant)) {
    return cn(base, pillSizes[size], "bg-brand-400 text-black hover:bg-brand-300 active:scale-[0.98]", className);
  }
  return cn(
    base,
    "h-11 px-1 text-sm text-ash hover:text-white",
    variant === "whatsapp" && "text-brand-300 hover:text-brand-200",
    className,
  );
}

function GhostArrow({ variant }: { variant: Variant }) {
  if (isPrimary(variant)) return null;
  return <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, children, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonStyles({ variant, size, className })} {...props}>
      {children}
    </button>
  );
});

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
  external?: boolean;
}

export function ButtonLink({ href, variant = "primary", size = "md", className, children, external, ...props }: ButtonLinkProps) {
  const classes = buttonStyles({ variant, size, className });
  const content = (
    <>
      {children}
      <GhostArrow variant={variant} />
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...props}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {content}
    </Link>
  );
}
