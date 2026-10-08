import type { PropertyType } from "@/types";
import { DEFAULT_SOLAR_PARAMETERS, FALLBACK_PEAK_SUN_HOURS, type SolarParameters } from "./solar-parameters";

export interface SolarSimulationInput {
  /** Valor médio mensal da conta de energia (R$). */
  monthlyBill: number;
  propertyType: Extract<PropertyType, "residencial" | "comercial" | "industrial" | "rural">;
  state: string;
  city: string;
}

export interface SolarSimulationResult {
  monthlyConsumptionKwh: number;
  monthlySavings: number;
  annualSavings: number;
  savings25Years: number;
  systemPowerKwp: number;
  panelCount: number;
  billReductionPercent: number;
  monthlyGenerationKwh: number;
  requiredAreaM2: number;
  co2AvoidedTonsPerYear: number;
  peakSunHours: number;
  /** Identifica a metodologia usada — útil para auditoria e testes A/B. */
  methodology: string;
}

/**
 * Contrato da calculadora. Para usar uma metodologia técnica real
 * (ex.: API de dimensionamento, PVGIS, base CRESESB por município),
 * basta criar outra implementação desta interface e trocá-la em
 * `solarCalculator` abaixo — a interface do simulador não muda.
 */
export interface SolarCalculator {
  calculate(input: SolarSimulationInput): SolarSimulationResult;
}

export function createReferenceSolarCalculator(params: SolarParameters = DEFAULT_SOLAR_PARAMETERS): SolarCalculator {
  return {
    calculate(input) {
      const tariff = params.defaultTariff;
      const peakSunHours = params.peakSunHoursByState[input.state] ?? FALLBACK_PEAK_SUN_HOURS;

      const monthlyConsumptionKwh = input.monthlyBill / tariff;
      const minimumKwh = params.minimumBilledKwh[input.propertyType];
      const compensableKwh = Math.max(monthlyConsumptionKwh - minimumKwh, 0);

      // Geração mensal de 1 kWp = HSP × 30 dias × PR
      const kwhPerKwpMonth = peakSunHours * 30 * params.performanceRatio;
      const idealPowerKwp = compensableKwh / kwhPerKwpMonth;

      const panelCount = Math.max(Math.ceil((idealPowerKwp * 1000) / params.panelPowerWp), compensableKwh > 0 ? 1 : 0);
      const systemPowerKwp = (panelCount * params.panelPowerWp) / 1000;
      const monthlyGenerationKwh = systemPowerKwp * kwhPerKwpMonth;

      const offsetKwh = Math.min(monthlyGenerationKwh, compensableKwh);
      const rawReduction = monthlyConsumptionKwh > 0 ? (offsetKwh / monthlyConsumptionKwh) * (1 - params.nonCompensableShare) : 0;
      const billReduction = Math.min(Math.max(rawReduction, 0), params.maxBillReduction);

      const monthlySavings = input.monthlyBill * billReduction;
      const annualSavings = monthlySavings * 12;

      let savings25Years = 0;
      for (let year = 0; year < params.analysisYears; year += 1) {
        const tariffFactor = (1 + params.annualTariffIncrease) ** year;
        const degradationFactor = (1 - params.annualPanelDegradation) ** year;
        savings25Years += annualSavings * tariffFactor * degradationFactor;
      }

      const co2AvoidedTonsPerYear = ((monthlyGenerationKwh * 12) / 1000) * params.gridEmissionFactor;

      return {
        monthlyConsumptionKwh: round(monthlyConsumptionKwh, 0),
        monthlySavings: round(monthlySavings, 0),
        annualSavings: round(annualSavings, 0),
        savings25Years: round(savings25Years, -2),
        systemPowerKwp: round(systemPowerKwp, 2),
        panelCount,
        billReductionPercent: round(billReduction * 100, 0),
        monthlyGenerationKwh: round(monthlyGenerationKwh, 0),
        requiredAreaM2: round(panelCount * params.panelAreaM2, 0),
        co2AvoidedTonsPerYear: round(co2AvoidedTonsPerYear, 1),
        peakSunHours,
        methodology: "referencia-demonstrativa-v1",
      };
    },
  };
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Instância usada pela aplicação. Troque aqui para mudar a metodologia. */
export const solarCalculator: SolarCalculator = createReferenceSolarCalculator();

export const SOLAR_SIMULATION_LIMITS = { minBill: 80, maxBill: 500_000 } as const;
