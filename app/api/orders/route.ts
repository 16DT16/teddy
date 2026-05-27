import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodaySession } from "@/lib/day";

const orderSchema = z.object({
  gojoId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
  customerText: z.string().max(500).optional().nullable()
});

export async function GET() {
  const session = await getOrCreateTodaySession();
  const orders = await prisma.order.findMany({
    where: { sessionId: session.id },
    include: { gojo: true, product: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const parsed = orderSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order data" }, { status: 400 });

  const session = await getOrCreateTodaySession();
  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product || !product.active) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const unitPrice = Number(product.price);
  const totalPrice = unitPrice * parsed.data.quantity;
  const order = await prisma.order.create({
    data: {
      sessionId: session.id,
      gojoId: parsed.data.gojoId,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      customerText: parsed.data.customerText || null,
      unitPrice,
      totalPrice
    },
    include: { gojo: true, product: true }
  });

  return NextResponse.json({ order }, { status: 201 });
}
