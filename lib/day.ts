import { prisma } from "@/lib/prisma";

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getOrCreateTodaySession() {
  const businessDate = startOfToday();
  return prisma.daySession.upsert({
    where: { businessDate },
    update: {},
    create: { businessDate, status: "OPEN", defaultSeatPrice: 0 }
  });
}

export function money(value: unknown) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(n);
}
