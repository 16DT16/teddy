import { prisma } from "@/lib/prisma";

const ADDIS_ABABA_OFFSET_MS =
  3 * 60 * 60 * 1000;

/**
 * Returns today's business date based on Addis Ababa time.
 *
 * The value is stored as UTC midnight, for example:
 * 2026-06-07T00:00:00.000Z
 *
 * This makes the database date stable regardless of whether
 * Next.js runs locally, on Vercel, or on another UTC server.
 */
export function startOfToday(date = new Date()) {
  const addisDate = new Date(
    date.getTime() + ADDIS_ABABA_OFFSET_MS,
  );

  return new Date(
    Date.UTC(
      addisDate.getUTCFullYear(),
      addisDate.getUTCMonth(),
      addisDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

export async function getOrCreateTodaySession() {
  const businessDate = startOfToday();

  return prisma.daySession.upsert({
    where: {
      businessDate,
    },
    update: {},
    create: {
      businessDate,
      status: "OPEN",
      defaultSeatPrice: 0,
    },
  });
}

export function money(value: unknown) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(
    Number.isFinite(amount) ? amount : 0,
  );
}