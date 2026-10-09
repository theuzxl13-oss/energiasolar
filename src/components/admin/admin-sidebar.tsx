"use client";

import Image from "next/image";
import Link from "next/link";
import { brandMonogram } from "@/components/layout/logo";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CircleHelp,
  ExternalLink,
  FileText,
  FolderKanban,
  Inbox,
  Layers,
  LayoutDashboard,
  Menu,
  MessageSquareQuote,
  PanelsTopLeft,
  Settings,
  X,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: Inbox },
  { label: "Orçamentos", href: "/admin/orcamentos", icon: FileText },
  { label: "Projetos", href: "/admin/projetos", icon: FolderKanban },
  { label: "Serviços", href: "/admin/servicos", icon: Layers },
  { label: "Depoimentos", href: "/admin/depoimentos", icon: MessageSquareQuote },
  { label: "FAQ", href: "/admin/faq", icon: CircleHelp },
  { label: "Conteúdo do Site", href: "/admin/conteudo", icon: PanelsTopLeft },
  { label: "Configurações", href: "/admin/configuracoes", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {ADMIN_NAV.map(({ label, href, icon: IconComponent }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-gradient-to-r from-brand-500/20 to-volt-500/10 text-white ring-1 ring-white/10" : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <IconComponent className={cn("size-[18px]", active && "text-brand-300")} aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-3 px-2">
      <Image src={brandMonogram} alt="" className="h-8 w-auto" sizes="64px" />
      <span className="leading-tight">
        <span className="block font-display font-bold text-white">{siteConfig.name}</span>
        <span className="block text-[11px] text-slate-500">Painel administrativo</span>
      </span>
    </Link>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-night-950 p-4 lg:flex">
        <Brand />
        <nav className="mt-8 flex-1 overflow-y-auto" aria-label="Menu administrativo">
          <NavLinks />
        </nav>
        <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
          <ExternalLink className="size-4" aria-hidden="true" /> Ver site
        </Link>
      </aside>

      {/* Mobile */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-night-950 px-4 lg:hidden">
        <Brand />
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Abrir menu" aria-expanded={open}>
          <Menu className="size-6" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu administrativo">
          <button type="button" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-label="Fechar menu" />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-night-950 p-4">
            <div className="flex items-center justify-between">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Fechar menu">
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-8 flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpen(false)} />
            </nav>
            <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:text-white">
              <ExternalLink className="size-4" aria-hidden="true" /> Ver site
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
