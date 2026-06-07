import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdmin() {
  try {
    await requireRole(["admin"]);
    return null;
  } catch {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }
}

export async function GET() {
  const unauthorized = await requireAdmin();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const staff = await prisma.staffAccount.findMany({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      staff,
    });
  } catch (error) {
    console.error("Load staff accounts error:", error);

    return NextResponse.json(
      {
        error: "Failed to load staff accounts.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  const unauthorized = await requireAdmin();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();

    const username = cleanText(
      body?.username,
    );

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (!username) {
      return NextResponse.json(
        {
          error: "Staff username is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.staffAccount.findUnique({
        where: {
          username,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "That staff username already exists.",
        },
        {
          status: 409,
        },
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const staff =
      await prisma.staffAccount.create({
        data: {
          username,
          passwordHash,
        },
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json(
      {
        staff,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create staff account error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to create staff account.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
) {
  const unauthorized = await requireAdmin();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();

    const id = cleanText(body?.id);

    const username = cleanText(
      body?.username,
    );

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Staff account ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!username) {
      return NextResponse.json(
        {
          error: "Staff username is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      password &&
      password.length < 8
    ) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        {
          status: 400,
        },
      );
    }

    const duplicate =
      await prisma.staffAccount.findFirst({
        where: {
          username,
          id: {
            not: id,
          },
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "Another staff account already uses that username.",
        },
        {
          status: 409,
        },
      );
    }

    const data: {
      username: string;
      passwordHash?: string;
    } = {
      username,
    };

    if (password) {
      data.passwordHash =
        await bcrypt.hash(password, 12);
    }

    const staff =
      await prisma.staffAccount.update({
        where: {
          id,
        },
        data,
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      staff,
    });
  } catch (error: any) {
    console.error(
      "Update staff account error:",
      error,
    );

    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          error:
            "Staff account not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to update staff account.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: NextRequest,
) {
  const unauthorized = await requireAdmin();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();

    const id = cleanText(body?.id);

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Staff account ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.staffAccount.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          username: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Staff account not found.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.staffAccount.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
      deletedId: id,
    });
  } catch (error: any) {
    console.error(
      "Delete staff account error:",
      error,
    );

    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          error:
            "Staff account not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to delete staff account.",
      },
      {
        status: 500,
      },
    );
  }
}