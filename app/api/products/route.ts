import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = normalizeText(body?.name);
    const category = normalizeText(body?.category);
    const unit = normalizeText(body?.unit) || "item";
    const price = Number(body?.price);

    if (!name || !category || !unit) {
      return NextResponse.json(
        { error: "Name, category, and unit are required." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Enter a valid product price." },
        { status: 400 },
      );
    }

    const existing = await prisma.product.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A product with this name already exists." },
        { status: 409 },
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        price,
        unit,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 },
    );
  }
}
