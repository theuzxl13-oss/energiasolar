/* Números e valores em reais por extenso (documentos: orçamentos e contratos). */

const UNITS = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function belowThousand(n: number): string {
  if (n === 100) return "cem";
  const parts: string[] = [];
  const rest = n % 100;
  if (n >= 100) parts.push(HUNDREDS[Math.floor(n / 100)]!);
  if (rest > 0 && rest < 20) parts.push(UNITS[rest]!);
  else if (rest >= 20) parts.push(rest % 10 ? `${TENS[Math.floor(rest / 10)]} e ${UNITS[rest % 10]}` : TENS[Math.floor(rest / 10)]!);
  return parts.join(" e ");
}

/** Inteiro por extenso (até 999 bilhões). Ex.: 1250 → "mil duzentos e cinquenta". */
export function integerToWords(value: number): string {
  value = Math.floor(Math.abs(value));
  if (value === 0) return "zero";
  const scales: [number, string, string][] = [
    [1e9, "bilhão", "bilhões"],
    [1e6, "milhão", "milhões"],
    [1e3, "mil", "mil"],
    [1, "", ""],
  ];
  const groups: { value: number; text: string }[] = [];
  let remaining = value;
  for (const [size, singular, plural] of scales) {
    const group = Math.floor(remaining / size);
    remaining %= size;
    if (!group) continue;
    if (size === 1e3) groups.push({ value: group, text: group === 1 ? "mil" : `${belowThousand(group)} mil` });
    else if (size === 1) groups.push({ value: group, text: belowThousand(group) });
    else groups.push({ value: group, text: `${belowThousand(group)} ${group === 1 ? singular : plural}` });
  }
  // "e" antes do último grupo quando ele é < 100 ou centena exata ("mil e cem", "um milhão e quinhentos mil").
  return groups
    .map((group, index) =>
      index > 0 && index === groups.length - 1 && (group.value < 100 || group.value % 100 === 0) ? `e ${group.text}` : group.text,
    )
    .join(" ");
}

/** Ex.: 24900.5 → "vinte e quatro mil e novecentos reais e cinquenta centavos". */
export function currencyToWords(value: number): string {
  const totalCents = Math.round(Math.abs(value) * 100);
  const reais = Math.floor(totalCents / 100);
  const cents = totalCents % 100;
  const parts: string[] = [];
  if (reais > 0) parts.push(`${integerToWords(reais)}${reais >= 1e6 && reais % 1e6 === 0 ? " de" : ""} ${reais === 1 ? "real" : "reais"}`);
  if (cents > 0) parts.push(`${integerToWords(cents)} ${cents === 1 ? "centavo" : "centavos"}`);
  return parts.length ? parts.join(" e ") : "zero real";
}

/** Ex.: (60, "dia", "dias") → "60 (sessenta) dias". */
export function quantityWithWords(value: number, singular: string, plural: string) {
  return `${value} (${integerToWords(value)}) ${value === 1 ? singular : plural}`;
}
