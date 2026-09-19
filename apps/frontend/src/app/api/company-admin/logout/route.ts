import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { COMPANY_ADMIN_COOKIE_NAME } from "@/lib/company-admin-session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(COMPANY_ADMIN_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
