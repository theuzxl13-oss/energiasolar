"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BRAZILIAN_STATES } from "@/lib/brazil";
import { SOLAR_SIMULATION_LIMITS, solarCalculator, type SolarSimulationInput, type SolarSimulationResult } from "@/lib/simulators/solar";
import { cn, formatCurrency, formatNumber, parseCurrencyInput } from "@/lib/utils";
import { ChoiceGroup, SelectField, TextField } from "@/components/forms/fields";
import { Button, ButtonLink } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { EXAMPLE_SOLAR_INPUT, SolarMethodology } from "./solar-methodology";

type PropertyOption = SolarSimulationInput["propertyType"];

const PROPERTY_OPTIONS: { value: PropertyOption; label: string }[] = [
  { value: "residencial", label: "Residencial" },
  { value: "comercial", label: "Comercial" },
  { value: "industrial", label: "Industrial" },
  { value: "rural", label: "Rural" },
];

type Errors = Partial<Record<"bill" | "propertyType" | "state" | "city", string>>;

export function SolarSimulator() {
  const [bill, setBill] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyOption | "">("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<{ input: SolarSimulationInput; output: SolarSimulationResult } | null>(null);
  const [tab, setTab] = useState<"simulador" | "metodologia">("simulador");

  const stateOptions = useMemo(() => BRAZILIAN_STATES.map((item) => ({ value: item.uf, label: `${item.name} (${item.uf})` })), []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const monthlyBill = parseCurrencyInput(bill);
    const nextErrors: Errors = {};
    if (!monthlyBill || monthlyBill < SOLAR_SIMULATION_LIMITS.minBill)
      nextErrors.bill = `Informe um valor a partir de ${formatCurrency(SOLAR_SIMULATION_LIMITS.minBill)}`;
    else if (monthlyBill > SOLAR_SIMULATION_LIMITS.maxBill) nextErrors.bill = "Para contas acima deste valor, solicite um estudo personalizado";
    if (!propertyType) nextErrors.propertyType = "Selecione o tipo de imóvel";
    if (!state) nextErrors.state = "Selecione o estado";
    if (city.trim().length < 2) nextErrors.city = "Informe a cidade";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !propertyType) return;

    const input: SolarSimulationInput = { monthlyBill, propertyType, state, city: city.trim() };
    setResult({ input, output: solarCalculator.calculate(input) });
    requestAnimationFrame(() => document.getElementById("resultado-solar")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  const quoteHref = result
    ? `/orcamento?${new URLSearchParams({
        servico: "solar",
        conta: String(result.input.monthlyBill),
        uf: result.input.state,
        cidade: result.input.city,
        imovel: result.input.propertyType,
      }).toString()}`
    : "/orcamento?servico=solar";

  const tabs = [
    { id: "simulador", label: "Simulador" },
    { id: "metodologia", label: "Como calculamos" },
  ] as const;

  return (
    <div>
      <div role="tablist" aria-label="Simulador solar" className="flex flex-wrap gap-x-8 gap-y-3 border-b border-white/10">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              id={`solar-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`solar-panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={cn("relative pb-4 text-xl tracking-[-0.03em] transition-colors sm:text-2xl", active ? "text-white" : "text-ash hover:text-white")}
            >
              {item.label}
              {active && <motion.span layoutId="solar-tab" className="absolute -bottom-px left-0 h-px w-full bg-brand-400" />}
            </button>
          );
        })}
      </div>

      <div id="solar-panel-metodologia" role="tabpanel" aria-labelledby="solar-tab-metodologia" hidden={tab !== "metodologia"} className="pt-12">
        <SolarMethodology input={result?.input ?? EXAMPLE_SOLAR_INPUT} isExample={!result} />
      </div>

      <div id="solar-panel-simulador" role="tabpanel" aria-labelledby="solar-tab-simulador" hidden={tab !== "simulador"} className="pt-12">
    <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
      <form onSubmit={handleSubmit} noValidate className="space-y-9 lg:col-span-5">
        <TextField
          label="Valor médio da conta de energia"
          prefix="R$"
          inputMode="decimal"
          placeholder="450,00"
          value={bill}
          onChange={(event) => setBill(event.target.value.replace(/[^\d.,]/g, ""))}
          error={errors.bill}
          hint="Considere a média dos últimos 12 meses, se possível."
          required
        />
        <ChoiceGroup label="Tipo de imóvel" name="solar-property" value={propertyType} onChange={setPropertyType} options={PROPERTY_OPTIONS} error={errors.propertyType} />
        <div className="grid gap-9 sm:grid-cols-2">
          <SelectField label="Estado" placeholder="Selecione" options={stateOptions} value={state} onChange={(event) => setState(event.target.value)} error={errors.state} required />
          <TextField label="Cidade" placeholder="Sua cidade" value={city} onChange={(event) => setCity(event.target.value)} error={errors.city} maxLength={80} required autoComplete="address-level2" />
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Button type="submit" size="lg">
            Calcular economia
          </Button>
          {result && (
            <Button
              variant="ghost"
              onClick={() => {
                setResult(null);
                setBill("");
              }}
            >
              Refazer simulação
            </Button>
          )}
        </div>
      </form>

      <div id="resultado-solar" className="lg:col-span-6 lg:col-start-7" aria-live="polite">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SolarResult result={result.output} />
              <div className="mt-6 flex flex-wrap gap-x-8">
                <ButtonLink href={quoteHref} size="lg" variant="ghost" className="text-white">
                  Receber orçamento completo
                </ButtonLink>
                <Button variant="ghost" onClick={() => setTab("metodologia")}>
                  Entenda como calculamos
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-white/10 pt-8">
              <p className="label-caps text-spark">Sua estimativa</p>
              <p className="text-title mt-5 text-white/40">Economia mensal, anual e em 25 anos, potência sugerida e quantidade de painéis.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
      </div>
    </div>
  );
}

function SolarResult({ result }: { result: SolarSimulationResult }) {
  const currency = (value: number) => formatCurrency(value);
  return (
    <div className="border-t border-white/10 pt-8">
      <p className="label-caps text-spark">Economia estimada em 25 anos</p>
      <p className="text-headline mt-4 text-white">
        <AnimatedNumber value={result.savings25Years} format={currency} />
      </p>

      <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3">
        <Metric label="Economia mensal" value={<AnimatedNumber value={result.monthlySavings} format={currency} />} accent />
        <Metric label="Economia anual" value={<AnimatedNumber value={result.annualSavings} format={currency} />} accent />
        <Metric label="Redução da conta" value={`${result.billReductionPercent}%`} />
        <Metric label="Potência sugerida" value={`${formatNumber(result.systemPowerKwp, 2)} kWp`} />
        <Metric label="Painéis" value={`${result.panelCount}`} />
        <Metric label="CO₂ evitado / ano" value={`${formatNumber(result.co2AvoidedTonsPerYear, 1)} t`} />
      </dl>

      <div className="mt-8 h-px w-full bg-white/10">
        <motion.div className="h-px bg-brand-400" initial={{ width: 0 }} animate={{ width: `${result.billReductionPercent}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </div>

      <p className="mt-6 text-sm font-extralight text-ash">
        Consumo estimado de {formatNumber(result.monthlyConsumptionKwh)} kWh/mês · geração estimada de {formatNumber(result.monthlyGenerationKwh)} kWh/mês · área
        aproximada de {formatNumber(result.requiredAreaM2)} m².
      </p>
      <p className="mt-4 text-sm font-extralight text-mist">
        <span className="text-spark">Valores estimados.</span> O dimensionamento definitivo depende de análise técnica, localização, consumo, orientação do imóvel e
        condições de instalação.
      </p>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div>
      <dt className="label-caps text-ash">{label}</dt>
      <dd className={accent ? "mt-2 text-3xl tracking-[-0.04em] text-brand-300" : "mt-2 text-3xl tracking-[-0.04em] text-white"}>{value}</dd>
    </div>
  );
}
