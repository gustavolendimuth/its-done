import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/analytics/:path*",
    "/work-hours/:path*",
    "/clients/:path*",
    "/invoices/:path*",
    "/settings/:path*",
    "/client-dashboard/:path*",
  ],
};
