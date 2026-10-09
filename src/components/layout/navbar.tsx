"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { mainNavigation } from "@/config/navigation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "./logo";
import { ThemeToggle } from "@/components/providers/theme";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-colors duration-300", scrolled || open ? "bg-black" : "bg-transparent")}>
      <nav className="mx-auto flex h-18 max-w-[1280px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10" aria-label="Navegação principal">
        <Logo />

        <ul className="hidden items-center gap-7 xl:flex">
          {mainNavigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("label-caps text-[13px] whitespace-nowrap transition-colors hover:text-white", active ? "text-white" : "text-ash")}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-3 xl:flex">
          <ThemeToggle />
          <ButtonLink href="/orcamento" size="sm">
            Solicitar orçamento
          </ButtonLink>
        </div>

        <div className="flex items-center gap-1 xl:hidden">
          <ThemeToggle />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex size-11 items-center justify-center text-white"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-18 bottom-0 overflow-y-auto bg-black xl:hidden"
          >
            <div className="flex min-h-full flex-col px-4 pt-6 pb-10 sm:px-6">
              <ul className="flex flex-col">
                {[{ label: "Início", href: "/" }, ...mainNavigation].map((item, index) => (
                  <motion.li key={item.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={cn("block py-3 text-4xl tracking-[-0.04em]", pathname === item.href ? "text-white" : "text-ash")}
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col items-start gap-4 pt-10">
                <ButtonLink href="/orcamento" size="lg">
                  Solicitar orçamento
                </ButtonLink>
                <ButtonLink href={buildWhatsAppUrl()} external variant="whatsapp">
                  Fale com um especialista
                </ButtonLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
