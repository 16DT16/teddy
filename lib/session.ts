import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "teddy_session";

function secret() {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export async function createSession(role: "admin" | "staff") {
  const payload = JSON.stringify({ role, ts: Date.now() });
  const encoded = Buffer.from(payload).toString("base64url");
  const token = `${encoded}.${sign(encoded)}`;
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSessionRole(): Promise<"admin" | "staff" | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expected = sign(encoded);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (data.role === "admin" || data.role === "staff") return data.role;
  } catch {}
  return null;
}

export async function requireRole(roles: Array<"admin" | "staff">) {
  const role = await getSessionRole();
  if (!role || !roles.includes(role)) throw new Error("UNAUTHORIZED");
  return role;
}
