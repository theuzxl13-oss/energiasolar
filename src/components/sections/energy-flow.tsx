"use client";

import { motion } from "framer-motion";
import { solarFlow } from "@/data/process";

/** Fluxo SOL → PAINÉIS → INVERSOR → IMÓVEL → REDE ELÉTRICA em sequência tipográfica. */
export function EnergyFlow() {
  return (
    <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
      {solarFlow.map((step, index) => (
        <motion.li
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: index * 0.12 }}
          className="relative pt-8"
        >
          {/* Linha de energia que "acende" em sequência */}
          <span className="absolute top-0 left-0 h-px w-full bg-white/10" aria-hidden="true" />
          <motion.span
            className="absolute top-0 left-0 h-px bg-brand-400"
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 + index * 0.25 }}
            aria-hidden="true"
          />
          <span className="label-caps text-spark">0{index + 1}</span>
          <h3 className="mt-3 text-3xl tracking-[-0.04em] text-white uppercase">{step.title}</h3>
          <p className="mt-3 text-sm font-extralight text-mist">{step.description}</p>
        </motion.li>
      ))}
    </ol>
  );
}
