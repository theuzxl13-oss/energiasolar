"use client";

import { MotionConfig } from "framer-motion";

/** Respeita a preferência do sistema por movimento reduzido em todas as animações. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
