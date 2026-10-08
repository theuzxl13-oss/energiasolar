import type { PropertyType } from "@/types";

/**
 * ============================================================================
 * PARÂMETROS DO SIMULADOR SOLAR (DEMONSTRATIVOS)
 * ============================================================================
 * Valores de referência aproximados, adequados para uma estimativa preliminar.
 * Para produção, substitua por dados oficiais (ex.: base de irradiação
 * CRESESB/INPE por município, tarifa vigente da distribuidora, regras de
 * compensação da Lei 14.300/2022 e dados do equipamento ofertado).
 * ============================================================================
 */

export interface SolarParameters {
  /** Horas de sol pleno médias diárias (kWh/m²/dia) por UF. */
  peakSunHoursByState: Record<string, number>;
  /** Tarifa média estimada com impostos (R$/kWh). */
  defaultTariff: number;
  /** Performance ratio do sistema (perdas de temperatura, cabos, inversor, sujeira). */
  performanceRatio: number;
  /** Potência do módulo de referência (Wp). */
  panelPowerWp: number;
  /** Área ocupada por módulo, incluindo espaçamento (m²). */
  panelAreaM2: number;
  /** Consumo mínimo faturado (custo de disponibilidade) em kWh por tipo de imóvel. */
  minimumBilledKwh: Record<PropertyType, number>;
  /** Parcela estimada da economia afetada por encargos não compensáveis (ex.: Fio B). */
  nonCompensableShare: number;
  /** Redução máxima exibida, por prudência comercial. */
  maxBillReduction: number;
  /** Reajuste tarifário anual estimado. */
  annualTariffIncrease: number;
  /** Degradação anual dos módulos. */
  annualPanelDegradation: number;
  /** Horizonte de análise (anos). */
  analysisYears: number;
  /** Fator de emissão médio do SIN (tCO₂/MWh). */
  gridEmissionFactor: number;
}

export const DEFAULT_SOLAR_PARAMETERS: SolarParameters = {
  peakSunHoursByState: {
    AC: 4.6, AL: 5.4, AP: 4.8, AM: 4.5, BA: 5.5, CE: 5.6, DF: 5.4, ES: 5.0, GO: 5.4,
    MA: 5.2, MT: 5.3, MS: 5.2, MG: 5.3, PA: 4.9, PB: 5.6, PR: 4.8, PE: 5.5, PI: 5.6,
    RJ: 4.9, RN: 5.7, RS: 4.7, RO: 4.7, RR: 4.9, SC: 4.6, SP: 4.9, SE: 5.4, TO: 5.4,
  },
  defaultTariff: 0.95,
  performanceRatio: 0.78,
  panelPowerWp: 610,
  panelAreaM2: 2.8,
  minimumBilledKwh: {
    residencial: 50,
    comercial: 100,
    industrial: 100,
    rural: 50,
    condominio: 100,
    outro: 50,
  },
  nonCompensableShare: 0.08,
  maxBillReduction: 0.95,
  annualTariffIncrease: 0.05,
  annualPanelDegradation: 0.005,
  analysisYears: 25,
  gridEmissionFactor: 0.0617,
};

export const FALLBACK_PEAK_SUN_HOURS = 5.0;
