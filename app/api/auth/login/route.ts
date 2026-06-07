import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  clearSession,
  createSession,
} from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const username = String(
      body?.username || "",
    ).trim();

    const password = String(
      body?.password || "",
    );

    const requestedRole =
      body?.role === "admin"
        ? "admin"
        : "staff";

    if (!username || !password) {
      return NextResponse.json(
        {
          error:
            "Username and password are required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Remove any previous staff/admin session before
     * creating the newly authenticated session.
     */
    await clearSession();

    if (requestedRole === "admin") {
      const adminUsername =
        process.env.APP_ADMIN_USERNAME;

      const adminPassword =
        process.env.APP_ADMIN_PASSWORD;

      if (!adminUsername || !adminPassword) {
        console.error(
          "APP_ADMIN_USERNAME or APP_ADMIN_PASSWORD is missing.",
        );

        return NextResponse.json(
          {
            error:
              "Admin login is not configured.",
          },
          {
            status: 500,
          },
        );
      }

      if (
        username !== adminUsername ||
        password !== adminPassword
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid admin username or password.",
          },
          {
            status: 401,
          },
        );
      }

      await createSession("admin");

      return NextResponse.json({
        ok: true,
        role: "admin",
        redirectTo: "/admin",
      });
    }

    const staff =
      await prisma.staffAccount.findUnique({
        where: {
          username,
        },
      });

    if (!staff) {
      return NextResponse.json(
        {
          error:
            "Invalid staff username or password.",
        },
        {
          status: 401,
        },
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        staff.passwordHash,
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error:
            "Invalid staff username or password.",
        },
        {
          status: 401,
        },
      );
    }

    await createSession("staff");

    return NextResponse.json({
      ok: true,
      role: "staff",
      redirectTo: "/staff",
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        error: "Login failed.",
      },
      {
        status: 500,
      },
    );
  }
}