import "server-only";
import { demoTestimonials } from "@/data/testimonials";
import { serverEnv } from "@/lib/env";
import type { Testimonial } from "@/types";

interface GooglePlaceReview {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string };
  relativePublishTimeDescription?: string;
}

/**
 * Retorna os depoimentos exibidos no site.
 * Se GOOGLE_PLACES_API_KEY e GOOGLE_PLACE_ID estiverem configurados, busca
 * as avaliações reais do Google (Places API New) com cache de 24h;
 * caso contrário, usa os depoimentos demonstrativos.
 */
export async function getTestimonials(): Promise<{ testimonials: Testimonial[]; source: "demo" | "google" }> {
  const { googlePlacesApiKey, googlePlaceId } = serverEnv();
  if (!googlePlacesApiKey || !googlePlaceId) return { testimonials: demoTestimonials, source: "demo" };

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(googlePlaceId)}?languageCode=pt-BR`, {
      headers: { "X-Goog-Api-Key": googlePlacesApiKey, "X-Goog-FieldMask": "reviews" },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) throw new Error(`Google Places respondeu ${response.status}`);
    const data = (await response.json()) as { reviews?: GooglePlaceReview[] };

    const testimonials: Testimonial[] = (data.reviews ?? [])
      .filter((review) => (review.rating ?? 0) >= 4 && (review.text?.text || review.originalText?.text))
      .slice(0, 6)
      .map((review, index) => ({
        id: `google-${index}`,
        author: review.authorAttribution?.displayName ?? "Cliente Google",
        role: `Avaliação no Google${review.relativePublishTimeDescription ? ` • ${review.relativePublishTimeDescription}` : ""}`,
        content: review.text?.text ?? review.originalText?.text ?? "",
        rating: review.rating ?? 5,
        service: "Google",
        source: "google",
      }));

    return testimonials.length ? { testimonials, source: "google" } : { testimonials: demoTestimonials, source: "demo" };
  } catch (error) {
    console.error("[reviews] Falha ao buscar avaliações:", error instanceof Error ? error.message : error);
    return { testimonials: demoTestimonials, source: "demo" };
  }
}
