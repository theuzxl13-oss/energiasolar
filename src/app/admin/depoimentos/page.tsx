import { Star } from "lucide-react";
import { getTestimonials } from "@/services/reviews";
import { AdminPageHeader, DemoNote, Panel } from "@/components/admin/ui";
import { DemoBadge } from "@/components/ui/primitives";

export const metadata = { title: "Depoimentos" };

export default async function AdminDepoimentosPage() {
  const { testimonials, source } = await getTestimonials();
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Depoimentos" description={source === "google" ? "Avaliações sincronizadas do Google" : "Depoimentos exibidos no site"} />
      {source === "demo" && (
        <DemoNote>
          Exibindo depoimentos demonstrativos. Para usar avaliações reais do Google, configure <code>GOOGLE_PLACES_API_KEY</code> e <code>GOOGLE_PLACE_ID</code>{" "}
          (sincronização automática a cada 24h) ou cadastre depoimentos autorizados em <code>src/data/testimonials.ts</code>.
        </DemoNote>
      )}
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {testimonials.map((testimonial) => (
          <li key={testimonial.id}>
            <Panel className="h-full">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5" aria-label={`${testimonial.rating} estrelas`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} className={index < testimonial.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-slate-300"} aria-hidden="true" />
                  ))}
                </div>
                {testimonial.source === "demo" && <DemoBadge tone="light" label="Demonstrativo" />}
              </div>
              <p className="mt-3 text-sm text-slate-600">“{testimonial.content}”</p>
              <p className="mt-4 text-sm font-semibold text-night-900">{testimonial.author}</p>
              <p className="text-xs text-slate-500">{testimonial.role}</p>
            </Panel>
          </li>
        ))}
      </ul>
    </div>
  );
}
