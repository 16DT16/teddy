import { cookies } from "next/headers";
import {
  createHmac,
  timingSafeEqual,
} from "crypto";

export type SessionRole = "admin" | "staff";

export type AppSession = {
  role: SessionRole;
  createdAt: number;
  expiresAt: number;
};

const COOKIE_NAME = "ambo_session";
const SESSION_DURATION_SECONDS =
  60 * 60 * 24 * 7;

function getSessionSecret() {
  const value = process.env.SESSION_SECRET;

  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET is missing in production.",
    );
  }

  return "dev-secret-change-me";
}

function sign(value: string) {
  return createHmac(
    "sha256",
    getSessionSecret(),
  )
    .update(value)
    .digest("hex");
}

function signaturesMatch(
  receivedSignature: string,
  expectedSignature: string,
) {
  try {
    const received = Buffer.from(
      receivedSignature,
      "hex",
    );

    const expected = Buffer.from(
      expectedSignature,
      "hex",
    );

    if (
      received.length === 0 ||
      received.length !== expected.length
    ) {
      return false;
    }

    return timingSafeEqual(
      received,
      expected,
    );
  } catch {
    return false;
  }
}

function isSessionRole(
  value: unknown,
): value is SessionRole {
  return (
    value === "admin" ||
    value === "staff"
  );
}

export async function createSession(
  role: SessionRole,
) {
  const createdAt = Date.now();

  const expiresAt =
    createdAt +
    SESSION_DURATION_SECONDS * 1000;

  const payload: AppSession = {
    role,
    createdAt,
    expiresAt,
  };

  const encoded = Buffer.from(
    JSON.stringify(payload),
    "utf8",
  ).toString("base64url");

  const signature = sign(encoded);
  const token = `${encoded}.${signature}`;

  const cookieStore = await cookies();

  cookieStore.set(
    COOKIE_NAME,
    token,
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
    },
  );

  return payload;
}

export async function clearSession() {
  const cookieStore = await cookies();

  cookieStore.set(
    COOKIE_NAME,
    "",
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    },
  );
}

export async function getSession():
  Promise<AppSession | null> {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [encoded, receivedSignature] =
    parts;

  if (
    !encoded ||
    !receivedSignature
  ) {
    return null;
  }

  const expectedSignature =
    sign(encoded);

  if (
    !signaturesMatch(
      receivedSignature,
      expectedSignature,
    )
  ) {
    return null;
  }

  try {
    const decoded = Buffer.from(
      encoded,
      "base64url",
    ).toString("utf8");

    const data = JSON.parse(
      decoded,
    ) as Partial<AppSession>;

    if (!isSessionRole(data.role)) {
      return null;
    }

    if (
      typeof data.createdAt !==
        "number" ||
      typeof data.expiresAt !==
        "number"
    ) {
      return null;
    }

    if (Date.now() >= data.expiresAt) {
      return null;
    }

    return {
      role: data.role,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function getSessionRole():
  Promise<SessionRole | null> {
  const session = await getSession();

  return session?.role ?? null;
}

export async function requireRole(
  allowedRoles: SessionRole[],
) {
  const session = await getSession();

  if (!session) {
    throw new Error(
      "UNAUTHENTICATED",
    );
  }

  if (
    !allowedRoles.includes(
      session.role,
    )
  ) {
    throw new Error("FORBIDDEN");
  }

  return session.role;
}