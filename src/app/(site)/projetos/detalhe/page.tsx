import { Suspense } from "react";
import { ProjectDetailFromUrl } from "@/components/projects/project-detail-from-url";

export const metadata = { title: "Projeto", robots: { index: false } };

/** Projetos criados no painel (sem página estática): /projetos/detalhe?slug=… */
export default function ProjetoDetalhePage() {
  return (
    <Suspense>
      <ProjectDetailFromUrl />
    </Suspense>
  );
}
