import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "");
  const password = String(body.password || "");
  const role = body.role === "admin" ? "admin" : "staff";

  if (username !== process.env.APP_USERNAME || password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  await createSession(role);
  return NextResponse.json({ ok: true, role });
}
