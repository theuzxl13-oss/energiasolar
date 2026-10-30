import { Star } from "lucide-react";
import { getTestimonials } from "@/services/reviews";
import { AdminPageHeader, DemoNote, Panel } from "@/components/admin/ui";

export const metadata = { title: "Depoimentos" };

export default async function AdminDepoimentosPage() {
  const { testimonials, source } = await getTestimonials();
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Depoimentos" description={source === "google" ? "Avaliações sincronizadas do Google" : "Depoimentos exibidos no site"} />
      {!testimonials.length && (
        <DemoNote>
          Nenhum depoimento cadastrado, por isso a seção de depoimentos está oculta no site. Ela volta a aparecer quando houver depoimentos reais e
          autorizados pelos clientes.
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
