import "server-only";

/**
 * Leitura centralizada das variáveis de ambiente SECRETAS (somente servidor).
 * O import "server-only" faz o build falhar caso este módulo seja
 * importado por um componente cliente, evitando vazamento de chaves.
 */
export function serverEnv() {
  return {
    aiProvider: process.env.AI_PROVIDER ?? "anthropic",
    aiApiKey: process.env.AI_API_KEY ?? "",
    aiModel: process.env.AI_MODEL ?? "claude-opus-5-5",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY ?? "",
    googlePlaceId: process.env.GOOGLE_PLACE_ID ?? "",
  };
}
