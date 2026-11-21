/**
 * Criptografia do login do painel, só com a Web Crypto da Cloudflare:
 * - Senhas: PBKDF2-SHA256 (100 mil iterações, o máximo da plataforma) com sal.
 * - Tokens de sessão e de recuperação: 32 bytes aleatórios; o banco guarda só o SHA-256.
 * - Código de 6 dígitos (TOTP, RFC 6238): o mesmo do app Senhas do iPhone e do Google Authenticator.
 */

const encoder = new TextEncoder();

export function randomBytes(length: number) {
  return crypto.getRandomValues(new Uint8Array(length));
}

export const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export function randomToken(bytes = 32) {
  return toHex(randomBytes(bytes));
}

export async function sha256Hex(text: string) {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text))));
}

/** Comparação em tempo constante (evita descobrir segredos medindo o tempo de resposta). */
export function safeEqual(a: string, b: string) {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index++) diff |= left[index]! ^ right[index]!;
  return diff === 0;
}

/* --------------------------------- Senhas ---------------------------------- */

const PBKDF2_ITERATIONS = 100_000;

async function pbkdf2(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return toHex(new Uint8Array(bits));
}

/** Formato guardado: pbkdf2$iterações$sal$hash */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${await pbkdf2(password, salt, PBKDF2_ITERATIONS)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, saltHex, hash] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterations || !saltHex || !hash) return false;
  const salt = Uint8Array.from(saltHex.match(/../g) ?? [], (pair) => parseInt(pair, 16));
  return safeEqual(await pbkdf2(password, salt, Number(iterations)), hash);
}

/** Senha boa o bastante: 12+ caracteres, com letras e números, e não óbvia. */
export function passwordProblem(password: string, email = "") {
  if (password.length < 12) return "Use pelo menos 12 caracteres.";
  if (password.length > 200) return "Senha longa demais.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "Misture letras e números.";
  const lower = password.toLowerCase();
  if (email && lower.includes(email.split("@")[0]!.toLowerCase())) return "A senha não pode conter o seu e-mail.";
  // Óbvias: um caractere repetido, sequências, ou só uma palavra comum com números/símbolos.
  const letters = lower.replace(/[^a-z]/g, "");
  if (/^(.)\1+$/.test(password) || /123456|654321/.test(password) || ["senha", "password", "qwerty", "abcdef", "admin", "teste", "dcecoenergy"].includes(letters)) {
    return "Escolha uma senha menos óbvia.";
  }
  return null;
}

/* ------------------------------ TOTP (app Senhas) --------------------------- */

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes: Uint8Array) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(text: string) {
  const clean = text.replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index < 0) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

export const newTotpSecret = () => base32Encode(randomBytes(20));

export function totpUri(secret: string, email: string, issuer: string) {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export async function totpAt(secret: string, step: number) {
  const key = await crypto.subtle.importKey("raw", base32Decode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const counter = new ArrayBuffer(8);
  new DataView(counter).setBigUint64(0, BigInt(step));
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, counter));
  const offset = mac[mac.length - 1]! & 15;
  const code = ((mac[offset]! & 127) << 24) | (mac[offset + 1]! << 16) | (mac[offset + 2]! << 8) | mac[offset + 3]!;
  return String(code % 1_000_000).padStart(6, "0");
}

/**
 * Confere o código aceitando 30 s de diferença de relógio. Devolve o "passo"
 * usado (para recusar o mesmo código duas vezes) ou `null`.
 */
export async function verifyTotp(secret: string, code: string, lastStep: number, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return null;
  const current = Math.floor(now / 30_000);
  for (const step of [current - 1, current, current + 1]) {
    if (step <= lastStep) continue;
    if (safeEqual(await totpAt(secret, step), code)) return step;
  }
  return null;
}
