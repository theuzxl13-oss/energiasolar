import { BRAZILIAN_STATES } from "@/lib/brazil";
import { PROPERTY_TYPE_LABELS } from "@/lib/labels";
import { DEFAULT_SOLAR_PARAMETERS as P } from "@/lib/simulators/solar-parameters";
import { computeSolarBreakdown, type SolarSimulationInput } from "@/lib/simulators/solar";
import { formatCurrency, formatNumber } from "@/lib/utils";

/** Exemplo usado quando o visitante ainda não fez a própria simulação. */
export const EXAMPLE_SOLAR_INPUT: SolarSimulationInput = { monthlyBill: 650, propertyType: "residencial", state: "SP", city: "São Paulo" };

const pct = (value: number, digits = 0) => `${formatNumber(value * 100, digits)}%`;

/**
 * Explica, em linguagem simples, cada etapa do cálculo do simulador solar,
 * usando os números da simulação do visitante (ou de um exemplo).
 */
export function SolarMethodology({ input, isExample }: { input: SolarSimulationInput; isExample: boolean }) {
  const b = computeSolarBreakdown(input, P);
  const stateName = BRAZILIAN_STATES.find((state) => state.uf === input.state)?.name ?? input.state;
  const kwh = (value: number) => `${formatNumber(value)} kWh`;

  const steps = [
    {
      title: "Descobrir o consumo",
      plain: "Quanto de energia você gasta por mês?",
      how: `Valor da conta ÷ preço médio da energia (${formatCurrency(b.tariff, true)}/kWh)`,
      math: `${formatCurrency(input.monthlyBill)} ÷ ${formatNumber(b.tariff, 2)}`,
      result: `${kwh(b.monthlyConsumptionKwh)}/mês`,
    },
    {
      title: "Tirar a taxa mínima",
      plain: "Mesmo com energia solar, a distribuidora sempre cobra um consumo mínimo.",
      how: `Desconta ${kwh(b.minimumKwh)} (imóvel ${PROPERTY_TYPE_LABELS[input.propertyType].toLowerCase()})`,
      math: `${formatNumber(b.monthlyConsumptionKwh)} − ${formatNumber(b.minimumKwh)}`,
      result: `${kwh(b.compensableKwh)} podem vir do sol`,
    },
    {
      title: "Ver o sol da região",
      plain: "Quanto cada placa consegue produzir onde você mora.",
      how: `Média de ${formatNumber(b.peakSunHours, 1)} h de sol forte por dia ${b.usedStateAverage ? `em ${stateName}` : "(média nacional)"} × 30 dias × ${pct(P.performanceRatio)} de aproveitamento (perdas de calor, cabos e sujeira)`,
      math: `${formatNumber(b.peakSunHours, 1)} × 30 × ${formatNumber(P.performanceRatio, 2)}`,
      result: `${kwh(b.kwhPerKwpMonth)}/mês por kWp`,
    },
    {
      title: "Calcular o tamanho do sistema",
      plain: "Quantas placas são necessárias.",
      how: `Energia necessária ÷ produção por kWp, arredondando para placas inteiras de ${P.panelPowerWp} W`,
      math: `${formatNumber(b.compensableKwh)} ÷ ${formatNumber(b.kwhPerKwpMonth)} = ${formatNumber(b.idealPowerKwp, 2)} kWp`,
      result: `${b.panelCount} placas · ${formatNumber(b.systemPowerKwp, 2)} kWp`,
    },
    {
      title: "Estimar a área no telhado",
      plain: "Quanto espaço as placas ocupam.",
      how: `Cerca de ${formatNumber(P.panelAreaM2, 1)} m² por placa`,
      math: `${b.panelCount} × ${formatNumber(P.panelAreaM2, 1)}`,
      result: `${formatNumber(b.requiredAreaM2)} m²`,
    },
    {
      title: "Calcular a redução da conta",
      plain: "Quanto a sua conta diminui.",
      how: `Parte do consumo coberta pelo sol, descontando ${pct(P.nonCompensableShare)} de encargos que não podem ser abatidos (limite de ${pct(P.maxBillReduction)})`,
      math: `(${formatNumber(b.offsetKwh)} ÷ ${formatNumber(b.monthlyConsumptionKwh)}) × ${formatNumber(1 - P.nonCompensableShare, 2)}`,
      result: `${pct(b.billReduction)} de redução`,
    },
    {
      title: "Economia por mês e por ano",
      plain: "Quanto sobra no seu bolso.",
      how: "Aplica a redução sobre o valor da conta e multiplica por 12",
      math: `${formatCurrency(input.monthlyBill)} × ${pct(b.billReduction)}`,
      result: `${formatCurrency(b.monthlySavings)}/mês · ${formatCurrency(b.annualSavings)}/ano`,
    },
    {
      title: "Economia em 25 anos",
      plain: "Quanto você economiza durante a vida útil das placas.",
      how: `Soma os ${P.analysisYears} anos, considerando reajuste da energia de ${pct(P.annualTariffIncrease)} ao ano e perda de ${pct(P.annualPanelDegradation, 1)} ao ano na produção das placas`,
      math: `Soma ano a ano (${P.analysisYears} anos)`,
      result: `≈ ${formatCurrency(Math.round(b.savings25Years / 100) * 100)}`,
    },
    {
      title: "Benefício ambiental",
      plain: "Quanto CO₂ deixa de ser emitido.",
      how: `Energia gerada no ano × fator médio de emissão da rede elétrica brasileira (${formatNumber(P.gridEmissionFactor, 4)} t/MWh)`,
      math: `${formatNumber((b.monthlyGenerationKwh * 12) / 1000, 1)} MWh × ${formatNumber(P.gridEmissionFactor, 4)}`,
      result: `≈ ${formatNumber(b.co2AvoidedTonsPerYear, 1)} t de CO₂/ano`,
    },
  ];

  return (
    <div>
      {/* Aviso principal */}
      <div className="border-l-2 border-spark pl-5">
        <p className="label-caps text-spark">Valor médio e demonstrativo</p>
        <p className="text-lead mt-3 max-w-3xl text-white">
          O simulador mostra uma <strong className="font-normal text-spark">estimativa média</strong>, calculada com valores de referência. Ele serve para dar uma
          ideia do potencial de economia. <strong className="font-normal text-spark">Não é um valor exato nem uma proposta comercial.</strong>
        </p>
      </div>

      <p className="mt-10 text-sm font-extralight text-mist">
        {isExample ? (
          <>
            Exemplo: conta de <span className="text-white">{formatCurrency(input.monthlyBill)}</span>, imóvel{" "}
            {PROPERTY_TYPE_LABELS[input.propertyType].toLowerCase()} em <span className="text-white">{stateName}</span>. Faça sua simulação na aba “Simulador” para ver
            esta explicação com os seus números.
          </>
        ) : (
          <>
            Com os números da sua simulação: conta de <span className="text-white">{formatCurrency(input.monthlyBill)}</span>, imóvel{" "}
            {PROPERTY_TYPE_LABELS[input.propertyType].toLowerCase()} em <span className="text-white">{input.city ? `${input.city} — ` : ""}{stateName}</span>.
          </>
        )}
      </p>

      {/* Passo a passo — celular: lista empilhada */}
      <ol className="mt-6 md:hidden">
        {steps.map((step, index) => (
          <li key={step.title} className="border-t border-white/10 py-6">
            <p className="label-caps text-ash">Passo {String(index + 1).padStart(2, "0")}</p>
            <p className="mt-2 text-xl tracking-[-0.02em] text-white">{step.title}</p>
            <p className="mt-1 text-sm font-extralight text-mist">{step.plain}</p>
            <p className="mt-3 text-sm font-extralight text-mist">{step.how}</p>
            <p className="mt-2 font-mono text-xs text-ash">{step.math}</p>
            <p className="mt-3 text-lg text-brand-300">{step.result}</p>
          </li>
        ))}
      </ol>

      {/* Passo a passo — desktop: tabela */}
      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left">
          <caption className="sr-only">Passo a passo do cálculo de economia com energia solar</caption>
          <thead>
            <tr className="label-caps text-ash">
              <th scope="col" className="w-12 py-4 pr-4 font-semibold">#</th>
              <th scope="col" className="py-4 pr-6 font-semibold">Etapa</th>
              <th scope="col" className="py-4 pr-6 font-semibold">Como calculamos</th>
              <th scope="col" className="py-4 pr-6 font-semibold">Conta</th>
              <th scope="col" className="py-4 font-semibold">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => (
              <tr key={step.title} className="border-t border-white/10 align-top">
                <td className="py-5 pr-4 text-ash">{String(index + 1).padStart(2, "0")}</td>
                <th scope="row" className="py-5 pr-6 font-normal">
                  <span className="block text-white">{step.title}</span>
                  <span className="mt-1 block text-sm font-extralight text-mist">{step.plain}</span>
                </th>
                <td className="py-5 pr-6 text-sm font-extralight text-mist">{step.how}</td>
                <td className="py-5 pr-6 font-mono text-xs whitespace-nowrap text-ash">{step.math}</td>
                <td className="py-5 text-brand-300">{step.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Por que é uma estimativa */}
      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        <div>
          <p className="label-caps text-spark">Por que é apenas uma estimativa</p>
          <ul className="mt-5 space-y-3 font-extralight text-mist">
            {[
              "Usa um preço médio de energia para todo o Brasil, e não a tarifa da sua distribuidora.",
              "Usa a média de sol do estado, e não a do seu endereço.",
              "Não considera a inclinação e a direção do telhado, nem sombras de árvores e prédios.",
              "Os encargos da conta e o reajuste futuro da energia são aproximações.",
              "Não inclui o preço do sistema nem o tempo de retorno do investimento.",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2.5 size-1 shrink-0 rounded-full bg-spark" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label-caps text-brand-400">O que define o valor exato</p>
          <p className="mt-5 font-extralight text-mist">
            Na <span className="text-white">análise técnica</span> avaliamos a sua conta de energia, a tarifa da distribuidora, o local e a posição do telhado, as sombras
            e a estrutura disponível. Só então apresentamos o dimensionamento definitivo, o investimento e o retorno.
          </p>
          <p className="text-title mt-8 text-white">“O simulador mostra o potencial. A proposta técnica mostra o número exato.”</p>
        </div>
      </div>
    </div>
  );
}
