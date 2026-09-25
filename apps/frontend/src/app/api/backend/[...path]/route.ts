import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

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

function isSafeSegment(segment: string): boolean {
  return (
    segment !== "" &&
    segment !== "." &&
    segment !== ".." &&
    !/[\\/]/.test(segment)
  );
}

async function proxy(req: NextRequest, path: string[]) {
  // The path comes from the browser: only plain segments may reach the
  // backend, so it cannot climb out of the API or change the target host.
  if (path.some((segment) => !isSafeSegment(segment))) {
    return NextResponse.json({ message: "Invalid path" }, { status: 400 });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const apiUrl = getApiUrl();
  const targetUrl = `${apiUrl}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;
  if (new URL(targetUrl).origin !== new URL(apiUrl).origin) {
    return NextResponse.json({ message: "Invalid path" }, { status: 400 });
  }

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
