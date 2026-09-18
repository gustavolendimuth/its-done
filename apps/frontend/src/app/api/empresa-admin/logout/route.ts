import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { EMPRESA_ADMIN_COOKIE_NAME } from "@/lib/empresa-admin-session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(EMPRESA_ADMIN_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
