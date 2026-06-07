import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdmin() {
  try {
    await requireRole(["admin"]);
    return null;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const body = await request.json();

    const name = normalizeText(body?.name);
    const category = normalizeText(body?.category);
    const unit = normalizeText(body?.unit) || "item";
    const price = Number(body?.price);

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
        { error: "Enter a valid product price." },
        { status: 400 },
      );
    }

    const duplicate = await prisma.product.findFirst({
      where: {
        id: { not: id },
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Another product already uses this name." },
        { status: 409 },
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

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("Update product error:", error);

    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    const linkedOrders = await prisma.order.count({
      where: { productId: id },
    });

    if (linkedOrders > 0) {
      return NextResponse.json(
        {
          error:
            "This product has existing orders and cannot be permanently deleted because it would break sales history.",
        },
        { status: 409 },
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      deletedProduct: product,
    });
  } catch (error: any) {
    console.error("Delete product error:", error);

    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 },
    );
  }
}
