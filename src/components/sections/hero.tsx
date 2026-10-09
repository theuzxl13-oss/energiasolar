"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { Constellation } from "@/components/illustrations/constellation";

const ease = [0.21, 0.6, 0.35, 1] as const;

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-36 lg:min-h-[100dvh] lg:pt-40 lg:pb-28">
      {/* Constelação: à direita no desktop, atrás do texto no celular */}
      <div className="absolute inset-0 -z-10 opacity-40 lg:inset-y-0 lg:right-[-6%] lg:left-auto lg:w-[58%] lg:opacity-100" aria-hidden="false">
        <Constellation shape="bolt" density={1600} label="Constelação de partículas em forma de raio, representando energia" />
      </div>

      <Container className="grid lg:grid-cols-12">
        <div className="lg:col-span-8">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="label-caps text-spark">
            {siteConfig.slogan}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease }}
            className="text-display mt-7 text-white"
          >
            Energia inteligente para um futuro sustentável.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="mt-10 grid gap-10 md:grid-cols-[1fr_auto] md:items-end"
          >
            <p className="text-lead max-w-md text-white">
              Projetamos soluções completas em energia solar, carregadores para veículos elétricos e eletropostos para residências,
              empresas, condomínios e indústrias.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3"
          >
            <ButtonLink href="/orcamento" size="lg">
              Solicitar orçamento
            </ButtonLink>
            <ButtonLink href="#simulador-solar" variant="ghost">
              Simular economia
            </ButtonLink>
            <ButtonLink href="#solucoes" variant="ghost">
              Conhecer soluções
            </ButtonLink>
          </motion.div>
        </div>
      </Container>

      <Container className="mt-24 lg:mt-32">
        <dl className="grid gap-10 sm:grid-cols-3">
          {[
            { term: "Projeto e engenharia", text: "Dimensionamento técnico e segurança em cada etapa." },
            { term: "Energia limpa", text: "Soluções renováveis para reduzir custos e emissões." },
            { term: "Solução completa", text: "Da análise à manutenção, com um único parceiro." },
          ].map((item) => (
            <div key={item.term} className="border-t border-white/10 pt-6">
              <dt className="text-lg text-white">{item.term}</dt>
              <dd className="mt-2 text-sm font-extralight text-mist">{item.text}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
