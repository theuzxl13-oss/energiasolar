"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tema do site público: "dark" (padrão) ou "light".
 * A escolha fica salva no navegador do visitante (localStorage).
 * Para remover a opção, basta tirar <ThemeToggle /> da navbar.
 */
export type Theme = "dark" | "light";
const STORAGE_KEY = "dc-theme";
const EVENT = "dc-theme-change";

function readStoredTheme(): Theme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(theme: Theme) {
  if (theme === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
}

/** Script inline: aplica o tema salvo antes da pintura, evitando "piscar" o tema escuro. */
export function ThemeScript() {
  const code = `try{if(localStorage.getItem("${STORAGE_KEY}")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

/** Mantém o tema sincronizado e o remove ao sair do site público (ex.: ir para o /admin). */
export function ThemeSync() {
  useEffect(() => {
    applyTheme(readStoredTheme());
    return () => applyTheme("dark");
  }, []);
  return null;
}

export function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const sync = () => setTheme(readStoredTheme());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* armazenamento indisponível — o tema vale só nesta página */
    }
    applyTheme(next);
    setTheme(next);
    window.dispatchEvent(new Event(EVENT));
  }

  const isLight = theme === "light";
  const label = isLight ? "Usar tema escuro" : "Usar tema claro";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn("inline-flex items-center gap-2 text-ash transition-colors hover:text-white", !showLabel && "size-10 justify-center rounded-full", className)}
    >
      {isLight ? <Moon className="size-[18px]" aria-hidden="true" /> : <Sun className="size-[18px]" aria-hidden="true" />}
      {showLabel && <span className="label-caps">{isLight ? "Tema escuro" : "Tema claro"}</span>}
    </button>
  );
}
