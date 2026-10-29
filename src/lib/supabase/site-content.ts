import type { Project } from "@/types";
import { getSupabase } from "./client";

/**
 * Conteúdo editável do site na tabela `site_content` (uma linha JSON por bloco).
 * Todos podem ler; só administradores gravam (RLS em `supabase/schema.sql`).
 * Fotos de projetos vão para o bucket público `projects` do Supabase Storage.
 */

export async function fetchSiteContent() {
  const { data, error } = await getSupabase().from("site_content").select("key, value");
  if (error) throw error;
  return data as { key: string; value: unknown }[];
}

/** Grava um bloco; `null` apaga (o site volta ao conteúdo padrão). */
export async function saveSiteContent(key: string, value: unknown) {
  const table = getSupabase().from("site_content");
  const { error } = value === null ? await table.delete().eq("key", key) : await table.upsert({ key, value });
  if (error) throw error;
}

/** Troca fotos embutidas (data:...) por arquivos no Storage, devolvendo os projetos com as URLs públicas. */
export async function uploadProjectImages(projects: Project[]) {
  const storage = getSupabase().storage.from("projects");
  return Promise.all(
    projects.map(async (project) => {
      if (!project.image?.startsWith("data:")) return project;
      const blob = await (await fetch(project.image)).blob();
      const path = `${crypto.randomUUID()}.jpg`;
      const { error } = await storage.upload(path, blob, { contentType: blob.type || "image/jpeg" });
      if (error) throw error;
      return { ...project, image: storage.getPublicUrl(path).data.publicUrl };
    }),
  );
}

export async function hasSession() {
  const { data } = await getSupabase().auth.getSession();
  return Boolean(data.session);
}
