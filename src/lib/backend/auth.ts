import { api } from "./client";

/** Login do painel (rotas /api/auth/* do servidor da Cloudflare). */

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
}

export type MfaStep = "ok" | "challenge" | "enroll";

export interface Me {
  user: AdminUser;
  mfa: MfaStep;
  /** Verificação em duas etapas ligada no servidor. */
  mfaRequired: boolean;
  recoveryRemaining: number | null;
}

/** Quem está logado; `null` sem login. */
export async function getMe(): Promise<Me | null> {
  try {
    return await api<Me>("/api/auth/me");
  } catch {
    return null;
  }
}

export const login = (email: string, password: string) => api<{ mfa: MfaStep }>("/api/auth/login", { body: { email, password } });
export const logout = () => api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
export const setupStatus = () => api<{ needed: boolean; configured: boolean }>("/api/auth/setup");
export const setupAdmin = (input: { secret: string; email: string; name: string; password: string }) => api("/api/auth/setup", { body: input });
export const startEnroll = () => api<{ secret: string; uri: string }>("/api/auth/mfa/enroll", { method: "POST", body: {} });
export const verifyCode = (code: string) => api<{ ok: true; recoveryRemaining: number }>("/api/auth/mfa/verify", { body: { code } });
export const redeemRecoveryCode = (code: string) => api("/api/auth/recovery/use", { body: { code } });
export const generateRecoveryCodes = () => api<{ codes: string[] }>("/api/auth/recovery/generate", { method: "POST", body: {} });
export const requestPasswordReset = (email: string) => api("/api/auth/forgot", { body: { email } });
export const checkResetToken = (token: string) => api<{ valid: boolean; needsCode: boolean }>("/api/auth/reset/check", { body: { token } });
export const resetPassword = (input: { token: string; password: string; code?: string }) => api("/api/auth/reset", { body: input });
export const changePassword = (current: string, next: string) => api("/api/auth/password", { body: { current, next } });

export interface TeamMember extends AdminUser {
  mfa: boolean;
}

export const listUsers = () => api<{ users: TeamMember[] }>("/api/admin/users");
export const createUser = (input: { email: string; name: string; password: string; role: "admin" | "usuario" }) => api("/api/admin/users", { body: input });
export const updateUser = (id: string, change: { active?: boolean; role?: "admin" | "usuario"; resetMfa?: boolean }) =>
  api(`/api/admin/users/${id}`, { method: "PATCH", body: change });
