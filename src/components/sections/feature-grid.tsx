import type { FeatureItem } from "@/types";
import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/** Grade tipográfica de benefícios: ícone em traço, título e texto ultraleve, sem caixas. */
export function FeatureGrid({ items, columns = "sm:grid-cols-2 lg:grid-cols-4" }: { items: FeatureItem[]; columns?: string; tone?: "light" | "dark" }) {
  return (
    <ul className={cn("grid gap-x-10 gap-y-12", columns)}>
      {items.map((item, index) => (
        <Reveal key={item.title} as="li" delay={index * 0.04} className="border-t border-white/10 pt-6">
          <Icon name={item.icon} className="size-5 text-brand-400" strokeWidth={1.5} />
          <h3 className="mt-5 text-xl tracking-[-0.02em] text-white">{item.title}</h3>
          <p className="mt-2 font-extralight text-mist">{item.description}</p>
        </Reveal>
      ))}
    </ul>
  );
}
