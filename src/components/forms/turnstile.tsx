"use client";

import { useEffect, useRef, useState } from "react";
import { getLeadsConfig } from "@/services/api-client";

/**
 * "Não sou robô" (Cloudflare Turnstile). Só aparece quando o servidor diz que
 * está configurado; na maioria das vezes confirma sozinho, sem o visitante
 * precisar clicar. O token vale para um envio: mude `resetKey` depois de cada envio.
 */

interface TurnstileApi {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptLoading: Promise<TurnstileApi> | null = null;

function loadTurnstile() {
  scriptLoading ??= new Promise<TurnstileApi>((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile indisponível")));
    script.onerror = () => {
      scriptLoading = null;
      reject(new Error("Turnstile indisponível"));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

export function Turnstile({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey: number }) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<{ api: TurnstileApi; id: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const tokenCallback = useRef(onToken);
  tokenCallback.current = onToken;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const config = await getLeadsConfig();
      if (cancelled || !config.enabled || !config.siteKey || !container.current) return;
      try {
        const api = await loadTurnstile();
        if (cancelled || !container.current) return;
        const id = api.render(container.current, {
          sitekey: config.siteKey,
          language: "pt-br",
          theme: "dark",
          callback: (token: string) => tokenCallback.current(token),
          "expired-callback": () => tokenCallback.current(null),
          "error-callback": () => tokenCallback.current(null),
        });
        widget.current = { api, id };
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (widget.current) widget.current.api.remove(widget.current.id);
      widget.current = null;
    };
  }, []);

  // Cada token serve para um envio: gera outro depois de enviar.
  useEffect(() => {
    if (resetKey && widget.current) {
      tokenCallback.current(null);
      widget.current.api.reset(widget.current.id);
    }
  }, [resetKey]);

  return (
    <div>
      <div ref={container} />
      {failed && (
        <p role="alert" className="mt-2 text-sm text-rose-300">
          Não foi possível carregar a verificação “não sou robô”. Desative bloqueadores de anúncio ou fale conosco pelo WhatsApp.
        </p>
      )}
    </div>
  );
}
