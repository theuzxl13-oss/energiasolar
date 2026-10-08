import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  breadcrumb: { name: string; path: string }[];
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/** Cabeçalho das páginas internas: título monumental à esquerda, apoio à direita. */
export function PageHero({ eyebrow, title, description, breadcrumb, actions, aside, className, children }: PageHeroProps) {
  const trail = [{ name: "Início", path: "/" }, ...breadcrumb];
  return (
    <section className={cn("relative isolate overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24", className)}>
      {aside && (
        <div className="absolute inset-0 -z-10 opacity-35 lg:right-[-4%] lg:left-auto lg:w-[48%] lg:opacity-100" aria-hidden="false">
          {aside}
        </div>
      )}
      <Container>
        <nav aria-label="Breadcrumb">
          <ol className="label-caps flex flex-wrap items-center gap-2 text-ash">
            {trail.map((item, index) => (
              <li key={item.path} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true">/</span>}
                {index === trail.length - 1 ? (
                  <span aria-current="page" className="text-white">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.path} className="hover:text-white">
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className={cn("mt-14", aside && "lg:max-w-[58%]")}>
          <h1 className="text-display text-white">{title}</h1>
          <div className="mt-10 max-w-xl">
            <Eyebrow>{eyebrow}</Eyebrow>
            <p className="text-lead mt-4 text-white">{description}</p>
          </div>
          {actions && <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">{actions}</div>}
        </div>
        {children}
      </Container>
      <BreadcrumbJsonLd items={trail} />
    </section>
  );
}
