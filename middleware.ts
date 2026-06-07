import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/staff") && !path.startsWith("/admin")) return NextResponse.next();
  const token = req.cookies.get("ambo_session")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("role", path.startsWith("/admin") ? "admin" : "staff");
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/staff/:path*", "/admin/:path*"] };
