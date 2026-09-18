import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getApiUrl } from "@/lib/utils";
import {
  EMPRESA_ADMIN_COOKIE_NAME,
  empresaAdminCookieOptions,
} from "@/lib/empresa-admin-session";

/**
 * Proxy server-side pro backend NestJS de tudo sob `/empresa-admin/*`. O
 * browser nunca vê o JWT do Administrador: este route handler lê o token do
 * cookie httpOnly (quando existe), anexa como `Authorization: Bearer` na
 * chamada real pro backend, e — se a resposta do backend trouxer um
 * `access_token` novo (login/register/activate/invite confirm) — grava esse
 * token de volta no cookie httpOnly e o remove do corpo devolvido ao
 * cliente, que nunca chega a lê-lo.
 */
async function proxy(req: NextRequest, path: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EMPRESA_ADMIN_COOKIE_NAME)?.value;

  const targetUrl = `${getApiUrl()}/empresa-admin/${path.join("/")}${req.nextUrl.search}`;

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const text = await req.text();
    if (text) {
      body = text;
      headers["Content-Type"] = req.headers.get("content-type") ?? "application/json";
    }
  }

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  const contentType = upstream.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await upstream.json();

    if (data && typeof data === "object" && "access_token" in data) {
      const { access_token: accessToken, ...rest } = data as {
        access_token: string;
        [key: string]: unknown;
      };
      const res = NextResponse.json(rest, { status: upstream.status });
      res.cookies.set(
        EMPRESA_ADMIN_COOKIE_NAME,
        accessToken,
        empresaAdminCookieOptions(),
      );
      return res;
    }

    return NextResponse.json(data, { status: upstream.status });
  }

  // Passa binários (ex: export CSV) direto, sem tentar interpretar como JSON.
  const blob = await upstream.blob();
  return new NextResponse(blob, {
    status: upstream.status,
    headers: { "Content-Type": contentType || "application/octet-stream" },
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}
