"use client";

import { useFaq } from "@/hooks/use-site-content";
import type { FaqItem } from "@/types";
import { Accordion } from "@/components/ui/accordion";

/** Perguntas do FAQ (editáveis em /admin/faq). */
export function FaqList({ category }: { category?: FaqItem["category"] }) {
  const { items } = useFaq();
  const visible = category ? items.filter((item) => item.category === category) : items;
  return <Accordion items={visible.map((item) => ({ id: item.id, title: item.question, content: item.answer }))} />;
}
