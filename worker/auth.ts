/**
 * Login do painel (substitui o Supabase Auth).
 * - Senha (PBKDF2) → sessão "nível 1" → código do app (TOTP) → sessão "nível 2".
 * - Dados do painel só com nível 2 (requireStaff/requireAdmin).
 * - Sessão em cookie HttpOnly + Secure + SameSite=Strict; o banco guarda só o hash.
 * - Códigos reserva para celular perdido; recuperação de senha por e-mail.
 */
import {
  hashPassword,
  newTotpSecret,
  passwordProblem,
  randomToken,
  safeEqual,
  sha256Hex,
  totpUri,
  verifyPassword,
  verifyTotp,
} from "./crypto";
import { nowIso, nowMs, recordFailure, tooManyFailures, type D1Database } from "./db";
import { clientIp, escapeHtml, isObject, json, readJson, sameOrigin, sendEmail, str, type Env } from "./http";

const COOKIE = "__Host-dc_session";
const SESSION_MS = 12 * 60 * 60 * 1000;
const ISSUER = "DC Eco Energy";
const FAIL_WINDOW = 15 * 60 * 1000;

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  active: number;
  password_hash: string;
  totp_secret: string | null;
  totp_pending: string | null;
  totp_last_step: number;
}

export interface Session {
  user: User;
  aal: 1 | 2;
  tokenHash: string;
}

/** Verificação em duas etapas ligada? (REQUIRE_MFA = "true" em wrangler.jsonc). Desligada, a senha basta. */
export const mfaRequired = (env: Env) => env.REQUIRE_MFA === "true";

const publicUser = (user: User) => ({ id: user.id, email: user.email, name: user.name, role: user.role, active: Boolean(user.active) });
const normalizeEmail = (value: unknown) => str(value, 160).toLowerCase();
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* --------------------------------- Sessão ---------------------------------- */

function readCookie(request: Request) {
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) return rest.join("=");
  }
  return null;
}

const sessionCookie = (token: string, maxAgeSeconds: number) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`;

export async function getSession(request: Request, env: Env): Promise<Session | null> {
  const token = readCookie(request);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `select s.aal as session_aal, u.* from sessions s join users u on u.id = s.user_id
     where s.token_hash = ? and s.expires_at > ? and u.active = 1`,
  )
    .bind(tokenHash, nowMs())
    .first<User & { session_aal: number }>();
  if (!row) return null;
  const { session_aal, ...user } = row;
  return { user, aal: session_aal === 2 ? 2 : 1, tokenHash };
}

async function startSession(db: D1Database, userId: string, aal: 1 | 2) {
  const token = randomToken();
  const now = nowMs();
  await db.batch([
    db.prepare("insert into sessions (token_hash, user_id, aal, created_at, expires_at) values (?, ?, ?, ?, ?)").bind(await sha256Hex(token), userId, aal, now, now + SESSION_MS),
    db.prepare("delete from sessions where expires_at < ?").bind(now),
  ]);
  return sessionCookie(token, SESSION_MS / 1000);
}

/** Equipe com a segunda etapa confirmada. Devolve a sessão ou a resposta de erro. */
export async function requireStaff(request: Request, env: Env): Promise<Session | Response> {
  const session = await getSession(request, env);
  if (!session) return json({ error: "Faça login." }, 401);
  if (session.aal !== 2) return json({ error: "Confirme o código do app." }, 403);
  if (request.method !== "GET" && !sameOrigin(request)) return json({ error: "Origem não permitida." }, 403);
  return session;
}

export async function requireAdmin(request: Request, env: Env): Promise<Session | Response> {
  const session = await requireStaff(request, env);
  if (session instanceof Response) return session;
  return session.user.role === "admin" ? session : json({ error: "Apenas administradores." }, 403);
}

function mfaStep(session: Session) {
  if (session.aal === 2) return "ok";
  return session.user.totp_secret ? "challenge" : "enroll";
}

async function recoveryRemaining(db: D1Database, userId: string) {
  const row = await db.prepare("select count(*) as n from recovery_codes where user_id = ? and used_at is null").bind(userId).first<{ n: number }>();
  return row?.n ?? 0;
}

/* --------------------------------- Rotas ----------------------------------- */

export async function handleAuth(request: Request, env: Env, path: string): Promise<Response> {
  switch (path) {
    case "/api/auth/me":
      return me(request, env);
    case "/api/auth/setup":
      return request.method === "GET" ? setupStatus(env) : setup(request, env);
    case "/api/auth/login":
      return login(request, env);
    case "/api/auth/logout":
      return logout(request, env);
    case "/api/auth/mfa/enroll":
      return mfaEnroll(request, env);
    case "/api/auth/mfa/verify":
      return mfaVerify(request, env);
    case "/api/auth/recovery/use":
      return recoveryUse(request, env);
    case "/api/auth/recovery/generate":
      return recoveryGenerate(request, env);
    case "/api/auth/forgot":
      return forgot(request, env);
    case "/api/auth/reset/check":
      return resetCheck(request, env);
    case "/api/auth/reset":
      return reset(request, env);
    case "/api/auth/password":
      return changePassword(request, env);
  }
  return json({ error: "Não encontrado." }, 404);
}

async function me(request: Request, env: Env) {
  const session = await getSession(request, env);
  if (!session) return json({ error: "Faça login." }, 401);
  return json({
    user: publicUser(session.user),
    mfa: mfaRequired(env) ? mfaStep(session) : "ok",
    mfaRequired: mfaRequired(env),
    recoveryRemaining: mfaRequired(env) && session.aal === 2 ? await recoveryRemaining(env.DB, session.user.id) : null,
  });
}

async function setupStatus(env: Env) {
  const row = await env.DB.prepare("select count(*) as n from users").first<{ n: number }>();
  return json({ needed: (row?.n ?? 0) === 0, configured: Boolean(env.ADMIN_SETUP_SECRET) });
}

/** Cria o primeiro administrador. Só funciona com o banco vazio e o código ADMIN_SETUP_SECRET. */
async function setup(request: Request, env: Env) {
  const read = await readJson(request);
  if ("error" in read) return read.error;
  if (!env.ADMIN_SETUP_SECRET || env.ADMIN_SETUP_SECRET.length < 16) return json({ error: "Cadastre o segredo ADMIN_SETUP_SECRET na Cloudflare." }, 503);
  if (await tooManyFailures(env.DB, `setup:${clientIp(request)}`, 5, FAIL_WINDOW)) return json({ error: "Muitas tentativas. Aguarde 15 minutos." }, 429);
  const body = isObject(read.body) ? read.body : {};
  if (!safeEqual(str(body.secret, 200), env.ADMIN_SETUP_SECRET)) {
    await recordFailure(env.DB, `setup:${clientIp(request)}`);
    return json({ error: "Código de configuração incorreto." }, 403);
  }
  const email = normalizeEmail(body.email);
  const name = str(body.name, 120);
  const password = typeof body.password === "string" ? body.password : "";
  if (!validEmail(email)) return json({ error: "E-mail inválido." }, 422);
  const problem = passwordProblem(password, email);
  if (problem) return json({ error: problem }, 422);

  const id = crypto.randomUUID();
  // "where not exists": se duas pessoas tentarem ao mesmo tempo, só a primeira vira admin.
  const result = await env.DB.prepare(
    `insert into users (id, email, name, role, active, password_hash)
     select ?, ?, ?, 'admin', 1, ? where not exists (select 1 from users)`,
  )
    .bind(id, email, name, await hashPassword(password))
    .run();
  if (!result.meta.changes) return json({ error: "O painel já foi configurado." }, 409);
  return json({ ok: true }, 200, { "Set-Cookie": await startSession(env.DB, id, mfaRequired(env) ? 1 : 2) });
}

// Hash de uma senha qualquer, para o login demorar o mesmo tempo com e-mail inexistente.
const DUMMY_HASH = "pbkdf2$100000$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000";

async function login(request: Request, env: Env) {
  const read = await readJson(request);
  if ("error" in read) return read.error;
  const body = isObject(read.body) ? read.body : {};
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  const ip = clientIp(request);

  if ((await tooManyFailures(env.DB, `login:${email}`, 5, FAIL_WINDOW)) || (await tooManyFailures(env.DB, `login-ip:${ip}`, 20, FAIL_WINDOW))) {
    return json({ error: "Muitas tentativas. Aguarde 15 minutos e tente novamente." }, 429);
  }
  const user = await env.DB.prepare("select * from users where email = ?").bind(email).first<User>();
  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    await recordFailure(env.DB, `login:${email}`);
    await recordFailure(env.DB, `login-ip:${ip}`);
    return json({ error: "E-mail ou senha incorretos." }, 401);
  }
  if (!user.active) return json({ error: "Este login não tem permissão para usar o painel. Fale com o administrador." }, 403);
  if (!mfaRequired(env)) return json({ mfa: "ok" }, 200, { "Set-Cookie": await startSession(env.DB, user.id, 2) });
  return json({ mfa: user.totp_secret ? "challenge" : "enroll" }, 200, { "Set-Cookie": await startSession(env.DB, user.id, 1) });
}

async function logout(request: Request, env: Env) {
  if (request.method !== "POST" || !sameOrigin(request)) return json({ error: "Requisição inválida." }, 403);
  const session = await getSession(request, env);
  if (session) await env.DB.prepare("delete from sessions where token_hash = ?").bind(session.tokenHash).run();
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
}

/** Primeiro acesso (ou celular novo): gera o segredo do app e devolve o link do QR code. */
async function mfaEnroll(request: Request, env: Env) {
  const read = await readJson(request);
  if ("error" in read) return read.error;
  const session = await getSession(request, env);
  if (!session) return json({ error: "Faça login." }, 401);
  if (session.user.totp_secret) return json({ error: "O app já está cadastrado." }, 409);
  const secret = newTotpSecret();
  await env.DB.prepare("update users set totp_pending = ? where id = ?").bind(secret, session.user.id).run();
  return json({ secret, uri: totpUri(secret, session.user.email, ISSUER) });
}

async function mfaVerify(request: Request, env: Env) {
  const read = await readJson(request);
  if ("error" in read) return read.error;
  const session = await getSession(request, env);
  if (!session) return json({ error: "Faça login." }, 401);
  const { user } = session;
  const key = `totp:${user.id}`;
  if (await tooManyFailures(env.DB, key, 5, FAIL_WINDOW)) return json({ error: "Muitas tentativas. Aguarde 15 minutos." }, 429);

  const code = str(isObject(read.body) ? read.body.code : "", 10).replace(/\s/g, "");
  const enrolling = !user.totp_secret;
  const secret = user.totp_secret ?? user.totp_pending;
  if (!secret) return json({ error: "Gere o QR code primeiro." }, 400);
  const step = await verifyTotp(secret, code, user.totp_last_step);
  if (step === null) {
    await recordFailure(env.DB, key);
    return json({ error: "Código incorreto ou expirado. Confira no app e tente de novo." }, 400);
  }
  await env.DB.batch([
    enrolling
      ? env.DB.prepare("update users set totp_secret = totp_pending, totp_pending = null, totp_last_step = ? where id = ?").bind(step, user.id)
      : env.DB.prepare("update users set totp_last_step = ? where id = ?").bind(step, user.id),
    env.DB.prepare("update sessions set aal = 2 where token_hash = ?").bind(session.tokenHash),
  ]);
  return json({ ok: true, recoveryRemaining: await recoveryRemaining(env.DB, user.id) });
}

const normalizeRecovery = (code: string) => code.toLowerCase().replace(/[^0-9a-z]/g, "");

/** Celular perdido: senha (nível 1) + código reserva → apaga o app antigo → cadastrar o novo. */
async function recoveryUse(request: Request, env: Env) {
  const read = await readJson(request);
  if ("error" in read) return read.error;
  const session = await getSession(request, env);
  if (!session) return json({ error: "Faça login." }, 401);
  const key = `recovery:${session.user.id}`;
  if (await tooManyFailures(env.DB, key, 5, 60 * 60 * 1000)) return json({ error: "Muitas tentativas. Aguarde 1 hora." }, 429);
  const code = normalizeRecovery(str(isObject(read.body) ? read.body.code : "", 40));
  const result = await env.DB.prepare("update recovery_codes set used_at = ? where user_id = ? and code_hash = ? and used_at is null")
    .bind(nowIso(), session.user.id, await sha256Hex(code))
    .run();
  if (!result.meta.changes) {
    await recordFailure(env.DB, key);
    return json({ error: "Código reserva inválido ou já usado." }, 400);
  }
  await env.DB.prepare("update users set totp_secret = null, totp_pending = null, totp_last_step = 0 where id = ?").bind(session.user.id).run();
  return json({ ok: true });
}

async function recoveryGenerate(request: Request, env: Env) {
  const read = await readJson(request);
  if ("error" in read) return read.error;
  const session = await getSession(request, env);
  if (!session) return json({ error: "Faça login." }, 401);
  if (session.aal !== 2) return json({ error: "Confirme o código do app antes de gerar códigos reserva." }, 403);
  const codes = Array.from({ length: 10 }, () => randomToken(8).match(/.{4}/g)!.join("-"));
  await env.DB.batch([
    env.DB.prepare("delete from recovery_codes where user_id = ?").bind(session.user.id),
    ...(await Promise.all(
      codes.map(async (code) =>
        env.DB.prepare("insert into recovery_codes (user_id, code_hash) values (?, ?)").bind(session.user.id, await sha256Hex(normalizeRecovery(code))),
      ),
    )),
  ]);
  return json({ codes });
}

/* -------------------------- Recuperação de senha --------------------------- */

async function forgot(request: Request, env: Env) {
  const read = await readJson(request);
  if ("error" in read) return read.error;
  const email = normalizeEmail(isObject(read.body) ? read.body.email : "");
  const ip = clientIp(request);
  if (await tooManyFailures(env.DB, `forgot-ip:${ip}`, 5, 60 * 60 * 1000)) return json({ error: "Muitas tentativas. Aguarde 1 hora." }, 429);
  await recordFailure(env.DB, `forgot-ip:${ip}`);
  const user = await env.DB.prepare("select * from users where email = ? and active = 1").bind(email).first<User>();
  // A resposta é a mesma com ou sem cadastro (não revela quem tem acesso).
  if (user && env.RESEND_API_KEY) {
    const token = randomToken();
    await env.DB.prepare("insert into password_resets (token_hash, user_id, expires_at) values (?, ?, ?)").bind(await sha256Hex(token), user.id, nowMs() + 60 * 60 * 1000).run();
    const link = `${new URL(request.url).origin}/admin/redefinir-senha/?token=${token}`;
    await sendEmail(env, {
      to: user.email,
      subject: "Redefinir a senha do painel",
      html: `<p>Para criar uma nova senha do painel, acesse o link abaixo (vale por 1 hora e uma única vez):</p><p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p><p>Se não foi você, ignore este e-mail.</p>`,
    }).catch((error) => console.error("[auth] Falha ao enviar e-mail de senha:", error instanceof Error ? error.message : error));
  }
  return json({ ok: true });
}

async function findReset(db: D1Database, token: string) {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  return db
    .prepare(
      `select r.token_hash, u.* from password_resets r join users u on u.id = r.user_id
       where r.token_hash = ? and r.used_at is null and r.expires_at > ? and u.active = 1`,
    )
    .bind(await sha256Hex(token), nowMs())
    .first<User & { token_hash: string }>();
}

async function resetCheck(request: Request, env: Env) {
  const read = await readJson(request);
  if ("error" in read) return read.error;
  const user = await findReset(env.DB, str(isObject(read.body) ? read.body.token : "", 80));
  return json({ valid: Boolean(user), needsCode: mfaRequired(env) && Boolean(user?.totp_secret) });
}

/** Nova senha pelo link do e-mail. Quem tem o app cadastrado confirma o código também. */
async function reset(request: Request, env: Env) {
  const read = await readJson(request);
  if ("error" in read) return read.error;
  const body = isObject(read.body) ? read.body : {};
  const user = await findReset(env.DB, str(body.token, 80));
  if (!user) return json({ error: "Link inválido ou expirado. Peça um novo na tela de login." }, 400);
  const key = `totp:${user.id}`;
  if (await tooManyFailures(env.DB, key, 5, FAIL_WINDOW)) return json({ error: "Muitas tentativas. Aguarde 15 minutos." }, 429);
  let step = user.totp_last_step;
  if (mfaRequired(env) && user.totp_secret) {
    const verified = await verifyTotp(user.totp_secret, str(body.code, 10), user.totp_last_step);
    if (verified === null) {
      await recordFailure(env.DB, key);
      return json({ error: "Código do app incorreto ou expirado." }, 400);
    }
    step = verified;
  }
  const password = typeof body.password === "string" ? body.password : "";
  const problem = passwordProblem(password, user.email);
  if (problem) return json({ error: problem }, 422);
  await env.DB.batch([
    env.DB.prepare("update users set password_hash = ?, totp_last_step = ? where id = ?").bind(await hashPassword(password), step, user.id),
    env.DB.prepare("update password_resets set used_at = ? where user_id = ? and used_at is null").bind(nowMs(), user.id),
    // Senha nova: derruba todas as sessões abertas.
    env.DB.prepare("delete from sessions where user_id = ?").bind(user.id),
  ]);
  return json({ ok: true });
}

async function changePassword(request: Request, env: Env) {
  const read = await readJson(request);
  if ("error" in read) return read.error;
  const session = await requireStaff(request, env);
  if (session instanceof Response) return session;
  const body = isObject(read.body) ? read.body : {};
  if (!(await verifyPassword(typeof body.current === "string" ? body.current : "", session.user.password_hash))) {
    return json({ error: "Senha atual incorreta." }, 400);
  }
  const next = typeof body.next === "string" ? body.next : "";
  const problem = passwordProblem(next, session.user.email);
  if (problem) return json({ error: problem }, 422);
  await env.DB.batch([
    env.DB.prepare("update users set password_hash = ? where id = ?").bind(await hashPassword(next), session.user.id),
    env.DB.prepare("delete from sessions where user_id = ? and token_hash <> ?").bind(session.user.id, session.tokenHash),
  ]);
  return json({ ok: true });
}

/* ---------------------------- Equipe (administrador) ------------------------ */

export async function handleUsers(request: Request, env: Env, path: string): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;

  if (path === "/api/admin/users" && request.method === "GET") {
    const { results } = await env.DB.prepare("select * from users order by created_at").all<User>();
    return json({ users: results.map((user) => ({ ...publicUser(user), mfa: Boolean(user.totp_secret) })) });
  }

  if (path === "/api/admin/users" && request.method === "POST") {
    const read = await readJson(request);
    if ("error" in read) return read.error;
    const body = isObject(read.body) ? read.body : {};
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    if (!validEmail(email)) return json({ error: "E-mail inválido." }, 422);
    const problem = passwordProblem(password, email);
    if (problem) return json({ error: problem }, 422);
    const role = body.role === "admin" ? "admin" : "usuario";
    const exists = await env.DB.prepare("select 1 from users where email = ?").bind(email).first();
    if (exists) return json({ error: "Já existe um login com este e-mail." }, 409);
    await env.DB.prepare("insert into users (id, email, name, role, active, password_hash) values (?, ?, ?, ?, 1, ?)")
      .bind(crypto.randomUUID(), email, str(body.name, 120), role, await hashPassword(password))
      .run();
    return json({ ok: true });
  }

  const match = path.match(/^\/api\/admin\/users\/([0-9a-f-]{36})$/);
  if (match && request.method === "PATCH") {
    const read = await readJson(request, { methods: ["PATCH"] });
    if ("error" in read) return read.error;
    const id = match[1]!;
    if (id === session.user.id) return json({ error: "Você não pode alterar o próprio acesso por aqui." }, 400);
    const body = isObject(read.body) ? read.body : {};
    const statements = [];
    if (typeof body.active === "boolean") {
      statements.push(env.DB.prepare("update users set active = ? where id = ?").bind(body.active ? 1 : 0, id));
      if (!body.active) statements.push(env.DB.prepare("delete from sessions where user_id = ?").bind(id));
    }
    if (body.role === "admin" || body.role === "usuario") statements.push(env.DB.prepare("update users set role = ? where id = ?").bind(body.role, id));
    if (body.resetMfa === true) {
      statements.push(env.DB.prepare("update users set totp_secret = null, totp_pending = null, totp_last_step = 0 where id = ?").bind(id));
      statements.push(env.DB.prepare("delete from sessions where user_id = ?").bind(id));
    }
    if (!statements.length) return json({ error: "Nada para alterar." }, 400);
    await env.DB.batch(statements);
    return json({ ok: true });
  }

  return json({ error: "Não encontrado." }, 404);
}
