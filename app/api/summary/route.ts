import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodaySession } from "@/lib/day";
import { requireRole } from "@/lib/session";

export async function GET() {
  try { await requireRole(["staff", "admin"]); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const session = await getOrCreateTodaySession();
  const [gojos, orders, dayGojos] = await Promise.all([
    prisma.gojo.findMany({ where: { active: true }, orderBy: { number: "asc" } }),
    prisma.order.findMany({ where: { sessionId: session.id, status: { not: "CANCELLED" } }, include: { gojo: true, product: true } }),
    prisma.dayGojo.findMany({ where: { sessionId: session.id }, include: { gojo: true } })
  ]);

  const dayGojoMap = new Map(dayGojos.map(d => [d.gojoId, d]));
  const byGojo = gojos.map(gojo => {
    const gojoOrders = orders.filter(o => o.gojoId === gojo.id);
    const orderTotal = gojoOrders.reduce((s, o) => s + Number(o.totalPrice), 0);
    const day = dayGojoMap.get(gojo.id);
    const peopleCount = day?.peopleCount || 0;
    const seatPrice = Number(day?.seatPrice || 0);
    const seatTotal = peopleCount * seatPrice;
    const products = Object.values(gojoOrders.reduce((acc: Record<string, any>, o) => {
      const key = o.product.name;
      acc[key] ||= { name: key, category: o.product.category, quantity: 0, total: 0 };
      acc[key].quantity += o.quantity;
      acc[key].total += Number(o.totalPrice);
      return acc;
    }, {}));
    return { gojo, peopleCount, seatPrice, seatTotal, orderTotal, grandTotal: orderTotal + seatTotal, products };
  });

  const productTotals = Object.values(orders.reduce((acc: Record<string, any>, o) => {
    const key = o.product.name;
    acc[key] ||= { name: key, category: o.product.category, quantity: 0, total: 0 };
    acc[key].quantity += o.quantity;
    acc[key].total += Number(o.totalPrice);
    return acc;
  }, {}));

  const totals = byGojo.reduce((acc, row) => {
    acc.orderTotal += row.orderTotal;
    acc.seatTotal += row.seatTotal;
    acc.grandTotal += row.grandTotal;
    return acc;
  }, { orderTotal: 0, seatTotal: 0, grandTotal: 0 });

  return NextResponse.json({ session, byGojo, productTotals, totals });
}
