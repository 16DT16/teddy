import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function parsePrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) ? price : NaN;
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
  if (unauthorized) return unauthorized;

  try {
    const products = await prisma.product.findMany({
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to load admin products:", error);

    return NextResponse.json(
      {
        error: "Failed to load products.",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    const name = cleanText(body.name);
    const category = cleanText(body.category);
    const unit = cleanText(body.unit);
    const price = parsePrice(body.price);

    if (!name || !category || !unit) {
      return NextResponse.json(
        { error: "Name, category, and unit are required." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Price must be a valid number greater than or equal to zero." },
        { status: 400 },
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

    return NextResponse.json(
      {
        message: "Product created successfully.",
        product,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Failed to create product:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A product with this name already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create product.",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    const id = cleanText(body.id);
    const name = cleanText(body.name);
    const category = cleanText(body.category);
    const unit = cleanText(body.unit);
    const price = parsePrice(body.price);

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 },
      );
    }

    if (!name || !category || !unit) {
      return NextResponse.json(
        { error: "Name, category, and unit are required." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Price must be a valid number greater than or equal to zero." },
        { status: 400 },
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        price,
        unit,
      },
    });

    return NextResponse.json({
      message: "Product updated successfully.",
      product,
    });
  } catch (error: any) {
    console.error("Failed to update product:", error);

    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A product with this name already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update product.",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 },
    );
  }
}
