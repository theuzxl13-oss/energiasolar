import { NextResponse, type NextRequest } from "next/server";

/**
 * Proteção do painel administrativo.
 * Se ADMIN_BASIC_AUTH_USER e ADMIN_BASIC_AUTH_PASSWORD estiverem definidos,
 * exige HTTP Basic Auth em /admin. Sem as variáveis, o painel fica aberto
 * (adequado apenas para demonstração local).
 * Em produção, substitua por Supabase Auth (ver README).
 */
export function proxy(request: NextRequest) {
  const user = process.env.ADMIN_BASIC_AUTH_USER;
  const password = process.env.ADMIN_BASIC_AUTH_PASSWORD;
  if (!user || !password) return NextResponse.next();

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const [providedUser, ...rest] = atob(header.slice(6)).split(":");
      if (providedUser === user && rest.join(":") === password) return NextResponse.next();
    } catch {
      /* cabeçalho inválido */
    }
  }

  return new NextResponse("Autenticação necessária.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Painel administrativo", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
