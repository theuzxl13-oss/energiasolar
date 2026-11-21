import type { Project } from "@/types";
import { api } from "./client";

/**
 * Conteúdo editável do site no banco da Cloudflare (um bloco JSON por chave).
 * Todos leem; só administradores gravam. Fotos ficam em /api/images/*.
 */

export const fetchSiteContent = () => api<{ key: string; value: unknown }[]>("/api/content");

/** Grava um bloco; `null` apaga (o site volta ao conteúdo padrão). */
export async function saveSiteContent(key: string, value: unknown) {
  await api(`/api/admin/content/${encodeURIComponent(key)}`, value === null ? { method: "DELETE" } : { method: "PUT", body: { value } });
}

/** Troca fotos embutidas (data:...) por arquivos no servidor, devolvendo os projetos com os endereços. */
export async function uploadProjectImages(projects: Project[]) {
  return Promise.all(
    projects.map(async (project) => {
      if (!project.image?.startsWith("data:")) return project;
      const blob = await (await fetch(project.image)).blob();
      const { url } = await api<{ url: string }>("/api/admin/images", { method: "POST", raw: blob });
      return { ...project, image: url };
    }),
  );
}

/** Há alguém logado com o login completo (para enviar edições antigas deste navegador)? */
export async function hasSession() {
  try {
    const me = await api<{ mfa: string }>("/api/auth/me");
    return me.mfa === "ok";
  } catch {
    return false;
  }
}
