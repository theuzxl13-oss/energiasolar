/**
 * ============================================================================
 * MOTOR DE RECOMENDAÇÃO DE CARREGADORES (DEMONSTRATIVO)
 * ============================================================================
 * Regras simplificadas para sugerir uma solução inicial. A recomendação
 * definitiva depende de vistoria: padrão de entrada, carga disponível,
 * distância do quadro, tipo de ligação e características do veículo.
 * Para trocar a lógica, implemente `ChargerRecommender` e substitua
 * `chargerRecommender` no final do arquivo.
 * ============================================================================
 */

export const INSTALL_LOCATIONS = ["residencia", "condominio", "empresa", "estacionamento", "comercio", "frota"] as const;
export type InstallLocation = (typeof INSTALL_LOCATIONS)[number];

export const CHARGING_PREFERENCES = ["normal", "rapido", "recomendacao"] as const;
export type ChargingPreference = (typeof CHARGING_PREFERENCES)[number];

export const LOCATION_LABELS: Record<InstallLocation, string> = {
  residencia: "Residência",
  condominio: "Condomínio",
  empresa: "Empresa",
  estacionamento: "Estacionamento",
  comercio: "Comércio",
  frota: "Frota",
};

export const PREFERENCE_LABELS: Record<ChargingPreference, string> = {
  normal: "Normal",
  rapido: "Rápido",
  recomendacao: "Não sei / Quero recomendação",
};

export interface ChargerSimulationInput {
  location: InstallLocation;
  vehicle: string;
  preference: ChargingPreference;
  points: number;
}

export interface ChargerRecommendation {
  solution: string;
  current: "AC" | "DC" | "AC + DC";
  powerKw: number;
  powerLabel: string;
  installation: string;
  /** Tempo estimado para recarregar de 20% a 80%. */
  chargingTime: string;
  application: string;
  batteryReferenceKwh: number;
  vehicleMatched: string | null;
  totalPowerKw: number;
  infrastructure: string[];
  notes: string[];
}

export interface ChargerRecommender {
  recommend(input: ChargerSimulationInput): ChargerRecommendation;
}

/** Capacidades aproximadas de bateria (kWh úteis) para referência do cálculo. */
const VEHICLE_REFERENCES: { match: RegExp; name: string; batteryKwh: number; maxAcKw: number }[] = [
  { match: /dolphin\s*mini|mini/i, name: "BYD Dolphin Mini", batteryKwh: 38, maxAcKw: 6.6 },
  { match: /dolphin/i, name: "BYD Dolphin", batteryKwh: 44.9, maxAcKw: 6.6 },
  { match: /seal/i, name: "BYD Seal", batteryKwh: 82.5, maxAcKw: 11 },
  { match: /yuan|atto\s*3/i, name: "BYD Yuan Plus", batteryKwh: 60.5, maxAcKw: 7 },
  { match: /ora/i, name: "GWM Ora 03", batteryKwh: 48, maxAcKw: 6.6 },
  { match: /ex30/i, name: "Volvo EX30", batteryKwh: 64, maxAcKw: 11 },
  { match: /xc40|c40|ex40/i, name: "Volvo XC40/EX40", batteryKwh: 75, maxAcKw: 11 },
  { match: /kwid/i, name: "Renault Kwid E-Tech", batteryKwh: 26.8, maxAcKw: 7 },
  { match: /e-?208|208/i, name: "Peugeot e-208", batteryKwh: 50, maxAcKw: 7.4 },
  { match: /bolt/i, name: "Chevrolet Bolt", batteryKwh: 65, maxAcKw: 7.4 },
  { match: /tesla|model\s*[3ysx]/i, name: "Tesla", batteryKwh: 75, maxAcKw: 11 },
  { match: /ix3|i4|ix1|bmw/i, name: "BMW (elétricos)", batteryKwh: 70, maxAcKw: 11 },
  { match: /leaf/i, name: "Nissan Leaf", batteryKwh: 40, maxAcKw: 6.6 },
];

const DEFAULT_BATTERY_KWH = 60;
const DEFAULT_MAX_AC_KW = 11;

function findVehicle(vehicle: string) {
  const normalized = vehicle.trim();
  if (!normalized) return null;
  return VEHICLE_REFERENCES.find((reference) => reference.match.test(normalized)) ?? null;
}

function formatHours(hours: number) {
  if (hours < 1) return `cerca de ${Math.max(10, Math.round((hours * 60) / 5) * 5)} min`;
  const whole = Math.floor(hours);
  const minutes = Math.round(((hours - whole) * 60) / 10) * 10;
  if (minutes === 0 || minutes === 60) return `cerca de ${minutes === 60 ? whole + 1 : whole} h`;
  return `cerca de ${whole} h ${minutes} min`;
}

interface Profile {
  solution: string;
  current: ChargerRecommendation["current"];
  powerKw: number;
  installation: string;
  application: string;
}

function selectProfile(location: InstallLocation, preference: ChargingPreference, points: number): Profile {
  const wantsFast = preference === "rapido";

  switch (location) {
    case "residencia":
      return wantsFast
        ? {
            solution: "Wallbox AC 11 kW (trifásico)",
            current: "AC",
            powerKw: 11,
            installation: "Parede ou pedestal, circuito trifásico dedicado",
            application: "Recarga residencial mais ágil, quando o padrão de entrada e o veículo permitem 11 kW",
          }
        : {
            solution: "Wallbox AC 7,4 kW",
            current: "AC",
            powerKw: 7.4,
            installation: "Parede, circuito monofásico/bifásico dedicado de 32 A",
            application: "Recarga noturna na garagem, ideal para o uso diário",
          };
    case "condominio":
      return {
        solution: wantsFast ? "Wallbox AC 11 kW com gestão de carga" : "Wallbox AC 7,4 kW com gestão de carga",
        current: "AC",
        powerKw: wantsFast ? 11 : 7.4,
        installation: "Pontos individuais por vaga, com medição individualizada e balanceamento dinâmico de carga",
        application: "Garagens de condomínios residenciais com múltiplos moradores",
      };
    case "empresa":
    case "comercio":
      return wantsFast
        ? {
            solution: "Carregador DC rápido 60 kW",
            current: "DC",
            powerKw: 60,
            installation: "Pedestal com alimentação trifásica dedicada; pode exigir adequação de entrada/transformador",
            application: "Clientes e visitantes com permanência curta, recargas em até 1 hora",
          }
        : {
            solution: "Carregador AC 22 kW",
            current: "AC",
            powerKw: 22,
            installation: "Parede ou pedestal, trifásico, com controle de acesso e gestão via plataforma",
            application: "Colaboradores e clientes com permanência de algumas horas",
          };
    case "estacionamento":
      return wantsFast
        ? {
            solution: "Carregador DC rápido 60 kW",
            current: "DC",
            powerKw: 60,
            installation: "Pedestal com proteção mecânica, sinalização de vaga e pagamento integrado",
            application: "Alta rotatividade de veículos e cobrança por recarga",
          }
        : {
            solution: points >= 4 ? "Carregadores AC 22 kW + 1 DC 60 kW (opcional)" : "Carregador AC 22 kW",
            current: points >= 4 ? "AC + DC" : "AC",
            powerKw: 22,
            installation: "Pedestais por vaga com gestão de carga e plataforma de cobrança",
            application: "Estacionamentos com permanência média e possibilidade de monetização",
          };
    case "frota":
      return wantsFast
        ? {
            solution: "Carregador DC 120 kW",
            current: "DC",
            powerKw: 120,
            installation: "Pedestal DC com infraestrutura em média tensão e gestão de energia",
            application: "Frotas com uso intenso e janelas curtas de recarga entre turnos",
          }
        : {
            solution: "Carregadores AC 22 kW com gestão de frota",
            current: "AC",
            powerKw: 22,
            installation: "Pedestais no pátio/garagem com agendamento de recarga e relatórios por veículo",
            application: "Frotas que recarregam durante a noite ou entre turnos longos",
          };
  }
}

export function createReferenceChargerRecommender(): ChargerRecommender {
  return {
    recommend(input) {
      const points = Math.min(Math.max(Math.round(input.points) || 1, 1), 500);
      const vehicle = findVehicle(input.vehicle);
      const batteryKwh = vehicle?.batteryKwh ?? DEFAULT_BATTERY_KWH;
      const vehicleMaxAc = vehicle?.maxAcKw ?? DEFAULT_MAX_AC_KW;

      const profile = selectProfile(input.location, input.preference, points);

      // Potência efetiva: em AC, limitada pelo carregador de bordo do veículo.
      const effectivePower = profile.current === "DC" ? profile.powerKw * 0.8 : Math.min(profile.powerKw, vehicleMaxAc) * 0.9;
      const energyNeeded = batteryKwh * 0.6; // 20% → 80%
      const hours = energyNeeded / effectivePower;

      const totalPowerKw = Math.round(profile.powerKw * points * 10) / 10;

      const infrastructure = [
        "Circuito elétrico dedicado e dimensionado para o carregador",
        "Proteções adequadas (disjuntor, DR e DPS) conforme projeto",
        "Aterramento verificado e adequado às normas técnicas",
      ];
      if (profile.current !== "AC") infrastructure.push("Avaliação da capacidade do transformador / entrada de energia");
      if (points > 1) infrastructure.push("Sistema de gestão e balanceamento de carga entre os pontos");
      if (input.location === "condominio") infrastructure.push("Medição individualizada por unidade e aprovação em assembleia");
      if (["estacionamento", "comercio", "empresa"].includes(input.location))
        infrastructure.push("Plataforma de gestão com controle de acesso e opção de cobrança");

      const notes: string[] = [];
      if (input.location === "residencia" && input.preference === "rapido") {
        notes.push("Carregadores DC rápidos não são usuais em residências pelo alto custo e demanda elétrica; a opção de 11 kW AC oferece o melhor equilíbrio.");
      }
      if (profile.current !== "DC" && vehicle && vehicle.maxAcKw < profile.powerKw) {
        notes.push(`O ${vehicle.name} aceita até cerca de ${vehicle.maxAcKw} kW em AC; o tempo considera esse limite.`);
      }
      if (!vehicle) {
        notes.push(`Tempo calculado com bateria de referência de ${DEFAULT_BATTERY_KWH} kWh. Informe o modelo para uma estimativa mais próxima.`);
      }
      if (totalPowerKw > 75) {
        notes.push("A potência total pode exigir aumento de carga junto à distribuidora ou adequação da subestação.");
      }

      return {
        solution: profile.solution,
        current: profile.current,
        powerKw: profile.powerKw,
        powerLabel: `${profile.powerKw.toLocaleString("pt-BR")} kW por ponto`,
        installation: profile.installation,
        chargingTime: `${formatHours(hours)} (de 20% a 80%)`,
        application: profile.application,
        batteryReferenceKwh: batteryKwh,
        vehicleMatched: vehicle?.name ?? null,
        totalPowerKw,
        infrastructure,
        notes,
      };
    },
  };
}

export const chargerRecommender: ChargerRecommender = createReferenceChargerRecommender();
