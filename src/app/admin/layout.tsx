import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Painel administrativo", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

/**
 * Layout do painel. O acesso exige login com verificação em duas etapas — ver
 * `src/components/admin/auth/admin-auth.tsx`. Os dados são protegidos pelo
 * servidor da Cloudflare (`worker/auth.ts`), que recusa pedidos sem login completo.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
