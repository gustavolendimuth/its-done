import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getApiUrl } from "@/lib/utils";
import {
  COMPANY_ADMIN_COOKIE_NAME,
  companyAdminCookieOptions,
} from "@/lib/company-admin-session";

/**
 * Server-side proxy to the NestJS backend for everything under
 * `/company-admin/*`. The browser never sees the admin's JWT: this route
 * handler reads the token from the httpOnly cookie (when present), attaches
 * it as `Authorization: Bearer` on the real backend call, and — if the
 * backend response carries a new `access_token` (login/register/activate/
 * invite confirm) — writes that token back into the httpOnly cookie and
 * strips it from the body returned to the client, which never gets to read
 * it.
 */
async function proxy(req: NextRequest, path: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COMPANY_ADMIN_COOKIE_NAME)?.value;

  const targetUrl = `${getApiUrl()}/company-admin/${path.join("/")}${req.nextUrl.search}`;

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
        COMPANY_ADMIN_COOKIE_NAME,
        accessToken,
        companyAdminCookieOptions(),
      );
      return res;
    }

    return NextResponse.json(data, { status: upstream.status });
  }

  // Pass binaries (e.g. CSV export) through directly, without trying to parse as JSON.
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
