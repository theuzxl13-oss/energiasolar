"use client";

import { useSearchParams } from "next/navigation";
import { ProjectDetail } from "./project-detail";

export function ProjectDetailFromUrl() {
  return <ProjectDetail slug={useSearchParams().get("slug") ?? ""} />;
}
