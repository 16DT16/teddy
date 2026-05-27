import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const statuses = ["NEW", "RECEIVED", "PREPARING", "DELIVERED", "CANCELLED"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRole(["staff", "admin"]); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!statuses.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const order = await prisma.order.update({
    where: { id },
    data: { status: body.status },
    include: { gojo: true, product: true }
  });
  return NextResponse.json({ order });
}
