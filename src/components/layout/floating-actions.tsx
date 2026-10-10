"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, LoaderCircle, MessageCircle, Send, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useWhatsAppUrl } from "@/hooks/use-site-content";
import { sendChatMessage } from "@/services/api-client";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Quanto posso economizar com energia solar?",
  "Posso carregar meu carro elétrico em casa?",
  "O que é um eletroposto?",
  "Dá para instalar carregador em condomínio?",
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3ZM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.6-3.4-1.6-5.3C2.1 6.5 6.5 2.2 12 2.2c2.6 0 5.1 1 7 2.9 1.9 1.9 2.9 4.3 2.9 7 0 5.4-4.4 9.7-9.9 9.7Zm8.4-18.1C18.2 1.5 15.2.3 12 .3 5.4.3.1 5.6.1 12.1c0 2.1.5 4.1 1.6 5.9L0 24l6.2-1.6c1.7.9 3.7 1.4 5.7 1.4 6.5 0 11.9-5.3 11.9-11.8 0-3.2-1.2-6.1-3.4-8.3Z" />
    </svg>
  );
}

export function FloatingActions() {
  const [open, setOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const whatsappHref = useWhatsAppUrl();

  useEffect(() => {
    const timer = window.setTimeout(() => setShowTip(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
        <AnimatePresence>
          {showTip && !open && (
            <motion.a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="hidden rounded-3xl border border-white/15 bg-black px-4 py-2.5 text-sm text-white sm:block"
            >
              Fale com um especialista
            </motion.a>
          )}
        </AnimatePresence>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Fale com um especialista pelo WhatsApp"
          className="relative flex size-14 items-center justify-center rounded-full bg-[#25D366] text-[#fff] transition hover:scale-105"
        >
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-[#25D366]" aria-hidden="true" />
          <WhatsAppIcon className="relative size-7" />
        </a>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Fechar chat" : "Abrir chat com assistente virtual"}
          aria-expanded={open}
          className="flex size-14 items-center justify-center rounded-full border border-white/20 bg-black text-white transition hover:border-brand-400 hover:scale-105"
        >
          {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        </button>
      </div>

      <AnimatePresence>{open && <ChatPanel onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Olá! Sou o assistente virtual da ${siteConfig.name}. Posso tirar dúvidas sobre energia solar, carregadores, wallbox e eletropostos. Como posso ajudar?`,
    },
  ]);
  const [input, setInput] = useState("");
  const whatsappHref = useWhatsAppUrl();
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim().slice(0, 1500);
    if (!content || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      // A saudação inicial é local; a API recebe a conversa a partir do usuário.
      const history = next.slice(1);
      const { reply } = await sendChatMessage(history);
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Não consegui responder agora. Tente novamente ou fale conosco pelo WhatsApp.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-label="Chat com assistente virtual"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-x-3 bottom-3 z-50 flex h-[min(620px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-3xl border border-white/15 bg-black sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[400px]"
    >
      <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4 text-white">
        <span className="flex size-10 items-center justify-center rounded-full border border-brand-400/50 text-brand-400">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="font-semibold">Assistente virtual</p>
          <p className="flex items-center gap-1.5 text-xs text-ash">
            <span className="size-1.5 rounded-full bg-brand-400" /> Online • respostas automáticas
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-ash hover:text-white" aria-label="Fechar chat">
          <X className="size-5" />
        </button>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5" aria-live="polite">
        {messages.map((message, index) => (
          <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                message.role === "user"
                  ? "rounded-br-sm bg-brand-400 text-black"
                  : "rounded-bl-sm border border-white/10 font-extralight text-white",
              )}
            >
              {message.content}
            </p>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-ash">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Digitando…
          </div>
        )}
        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="rounded-3xl border border-white/15 px-3 py-1.5 text-left text-xs text-mist transition hover:border-brand-400 hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="chat-input" className="sr-only">
            Digite sua mensagem
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={1500}
            placeholder="Digite sua dúvida…"
            className="h-11 flex-1 rounded-3xl border border-white/15 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex size-11 items-center justify-center rounded-full bg-brand-400 text-black transition hover:bg-brand-300 disabled:opacity-40"
            aria-label="Enviar mensagem"
          >
            <Send className="size-4" />
          </button>
        </form>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 text-xs text-ash hover:text-white"
        >
          <WhatsAppIcon className="size-3.5" /> Prefere falar com uma pessoa? Abrir WhatsApp
        </a>
      </div>
    </motion.div>
  );
}
