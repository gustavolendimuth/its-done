import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import { getApiUrl } from "@/lib/utils";

function removeAccessTokens(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(removeAccessTokens);
  }

  if (data && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([key]) => key !== "access_token")
        .map(([key, value]) => [key, removeAccessTokens(value)])
    );
  }

  return data;
}

async function proxy(req: NextRequest, path: string[]) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const targetUrl = `${getApiUrl()}/${path.join("/")}${req.nextUrl.search}`;

  const headers: Record<string, string> = {};
  if (token?.accessToken) {
    headers.Authorization = `Bearer ${token.accessToken}`;
  }

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const text = await req.text();
    if (text) {
      body = text;
      headers["Content-Type"] =
        req.headers.get("content-type") ?? "application/json";
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
    return NextResponse.json(removeAccessTokens(data), {
      status: upstream.status,
    });
  }

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
