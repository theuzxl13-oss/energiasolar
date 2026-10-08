"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import {
  CHARGING_PREFERENCES,
  INSTALL_LOCATIONS,
  LOCATION_LABELS,
  PREFERENCE_LABELS,
  chargerRecommender,
  type ChargerRecommendation,
  type ChargerSimulationInput,
  type ChargingPreference,
  type InstallLocation,
} from "@/lib/simulators/charger";
import { formatNumber } from "@/lib/utils";
import { ChoiceGroup, TextField } from "@/components/forms/fields";
import { Button, ButtonLink } from "@/components/ui/button";

const LOCATION_OPTIONS = INSTALL_LOCATIONS.map((value) => ({ value, label: LOCATION_LABELS[value] }));
const PREFERENCE_OPTIONS = CHARGING_PREFERENCES.map((value) => ({ value, label: PREFERENCE_LABELS[value] }));

const SERVICE_BY_LOCATION: Record<InstallLocation, string> = {
  residencia: "carregador-residencial",
  condominio: "condominio",
  empresa: "carregador-empresarial",
  estacionamento: "carregador-empresarial",
  comercio: "carregador-empresarial",
  frota: "frota",
};

export function ChargerSimulator() {
  const [location, setLocation] = useState<InstallLocation | "">("");
  const [vehicle, setVehicle] = useState("");
  const [preference, setPreference] = useState<ChargingPreference | "">("");
  const [points, setPoints] = useState(1);
  const [errors, setErrors] = useState<{ location?: string; preference?: string }>({});
  const [result, setResult] = useState<{ input: ChargerSimulationInput; output: ChargerRecommendation } | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!location) nextErrors.location = "Selecione onde deseja instalar";
    if (!preference) nextErrors.preference = "Selecione o tipo de carregamento";
    setErrors(nextErrors);
    if (!location || !preference) return;
    const input: ChargerSimulationInput = { location, vehicle: vehicle.trim(), preference, points };
    setResult({ input, output: chargerRecommender.recommend(input) });
    requestAnimationFrame(() => document.getElementById("resultado-carregador")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  const quoteHref = result
    ? `/orcamento?${new URLSearchParams({
        servico: SERVICE_BY_LOCATION[result.input.location],
        veiculos: String(result.input.points),
        solucao: result.output.solution,
      }).toString()}`
    : "/orcamento?servico=carregador";

  return (
    <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
      <div id="resultado-carregador" className="order-2 lg:order-1 lg:col-span-6" aria-live="polite">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border-t border-white/10 pt-8">
              <p className="label-caps text-spark">Solução recomendada · corrente {result.output.current}</p>
              <p className="text-headline mt-4 text-white">{result.output.solution}</p>

              <dl className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2">
                <Detail label="Potência" value={result.output.powerLabel} />
                <Detail label="Tempo estimado de carregamento" value={result.output.chargingTime} />
                <Detail label="Tipo de instalação" value={result.output.installation} />
                <Detail label="Aplicação recomendada" value={result.output.application} />
              </dl>

              {result.input.points > 1 && (
                <p className="mt-8 text-sm font-extralight text-mist">
                  Potência total instalada: <span className="text-white">{formatNumber(result.output.totalPowerKw, 1)} kW</span> para {result.input.points} pontos (antes da
                  gestão de carga).
                </p>
              )}

              <p className="label-caps mt-10 text-ash">Infraestrutura prevista</p>
              <ul className="mt-4 space-y-2 text-sm font-extralight text-mist">
                {result.output.infrastructure.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>

              {result.output.notes.map((note) => (
                <p key={note} className="mt-4 text-sm font-extralight text-mist">
                  <span className="text-spark">Nota.</span> {note}
                </p>
              ))}
              <p className="mt-6 text-xs text-ash">Recomendação preliminar. A solução definitiva depende de vistoria técnica no local.</p>

              <ButtonLink href={quoteHref} variant="ghost" className="mt-4 text-white">
                Solicitar avaliação técnica
              </ButtonLink>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-white/10 pt-8">
              <p className="label-caps text-spark">Sua recomendação</p>
              <p className="text-title mt-5 text-white/40">Potência, tipo de instalação, tempo estimado de recarga e aplicação ideal.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} noValidate className="order-1 space-y-9 lg:order-2 lg:col-span-5 lg:col-start-8">
        <ChoiceGroup label="Onde deseja instalar?" name="charger-location" value={location} onChange={setLocation} options={LOCATION_OPTIONS} error={errors.location} />
        <TextField
          label="Qual veículo elétrico você possui?"
          placeholder="Marca e modelo (ex.: BYD Dolphin)"
          value={vehicle}
          onChange={(event) => setVehicle(event.target.value)}
          maxLength={80}
          hint="Opcional — ajuda a estimar o tempo de recarga."
        />
        <ChoiceGroup label="Tipo de carregamento desejado" name="charger-preference" value={preference} onChange={setPreference} options={PREFERENCE_OPTIONS} error={errors.preference} />

        <div>
          <p id="points-label" className="label-caps text-ash">
            Quantidade de pontos de recarga
          </p>
          <div className="mt-3 flex items-center gap-4" role="group" aria-labelledby="points-label">
            <button
              type="button"
              onClick={() => setPoints((value) => Math.max(1, value - 1))}
              className="flex size-11 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-brand-400"
              aria-label="Diminuir quantidade"
            >
              <Minus className="size-4" />
            </button>
            <input
              type="number"
              min={1}
              max={500}
              value={points}
              onChange={(event) => setPoints(Math.min(500, Math.max(1, Number(event.target.value) || 1)))}
              className="w-20 border-0 bg-transparent text-center text-4xl tracking-[-0.04em] text-white outline-none focus:ring-0"
              aria-label="Quantidade de pontos de recarga"
            />
            <button
              type="button"
              onClick={() => setPoints((value) => Math.min(500, value + 1))}
              className="flex size-11 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-brand-400"
              aria-label="Aumentar quantidade"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Button type="submit" size="lg">
            Ver solução recomendada
          </Button>
          {result && (
            <Button variant="ghost" onClick={() => setResult(null)}>
              Refazer
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-caps text-ash">{label}</dt>
      <dd className="mt-2 text-lg font-extralight text-white">{value}</dd>
    </div>
  );
}
