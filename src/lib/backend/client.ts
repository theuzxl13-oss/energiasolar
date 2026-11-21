/**
 * Conexão do navegador com o servidor do site (Cloudflare Worker, rotas /api/*).
 * Os dados ficam no banco D1 da Cloudflare; o login usa cookie seguro
 * (HttpOnly), então nenhuma chave ou token fica acessível ao JavaScript.
 */

/** Servidor ligado? Sem ele (ex.: `next dev`), o painel roda em modo demonstração local, sem login. */
export const isBackendEnabled = process.env.NEXT_PUBLIC_BACKEND === "cloudflare";

export class BackendError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

/** Chama uma rota /api/* com JSON e devolve a resposta; erros viram `BackendError`. */
export async function api<T>(path: string, init: { method?: string; body?: unknown; raw?: Blob } = {}): Promise<T> {
  const method = init.method ?? (init.body === undefined && !init.raw ? "GET" : "POST");
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: init.raw ? { "Content-Type": init.raw.type } : init.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init.raw ?? (init.body === undefined ? undefined : JSON.stringify(init.body)),
  }).catch(() => {
    throw new BackendError("Sem conexão com o servidor. Verifique sua internet.", 0);
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string; fieldErrors?: Record<string, string[]> };
  if (!response.ok) throw new BackendError(data.error ?? "Não foi possível concluir. Tente novamente.", response.status, data.fieldErrors);
  return data;
}

/** Endereço absoluto de uma página do site (considera o basePath do GitHub Pages). */
export function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${window.location.origin}${base}${path}`;
}
