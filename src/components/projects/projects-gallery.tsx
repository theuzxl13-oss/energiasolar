"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PROJECT_CATEGORY_LABELS } from "@/data/projects";
import type { Project, ProjectCategory } from "@/types";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./project-card";

type Filter = "todos" | ProjectCategory;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "todos", label: "Todos" },
  ...(Object.keys(PROJECT_CATEGORY_LABELS) as ProjectCategory[]).map((value) => ({ value, label: PROJECT_CATEGORY_LABELS[value] })),
];

export function ProjectsGallery({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("todos");
  const visible = filter === "todos" ? projects : projects.filter((project) => project.category === filter);

  return (
    <div>
      <div role="tablist" aria-label="Filtrar projetos por categoria" className="flex flex-wrap gap-x-8 gap-y-3 border-b border-white/10 pb-6">
        {FILTERS.map((item) => {
          const count = item.value === "todos" ? projects.length : projects.filter((project) => project.category === item.value).length;
          const active = filter === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(item.value)}
              className={cn("relative pb-1 text-2xl tracking-[-0.03em] transition-colors sm:text-3xl", active ? "text-white" : "text-ash hover:text-white")}
            >
              {item.label}
              <sup className="ml-1 text-xs tracking-normal text-spark">{count}</sup>
              {active && <motion.span layoutId="project-filter" className="absolute -bottom-[25px] left-0 h-px w-full bg-brand-400" />}
            </button>
          );
        })}
      </div>

      <motion.ul layout className="mt-14 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((project) => (
            <motion.li key={project.slug} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <ProjectCard project={project} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
