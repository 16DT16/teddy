import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodaySession } from "@/lib/day";
import { requireRole } from "@/lib/session";

const schema = z.object({
  gojoId: z.string().min(1),
  peopleCount: z.coerce.number().int().min(0).max(999),
  seatPrice: z.coerce.number().min(0).max(999999),
  note: z.string().max(500).optional().nullable()
});

export async function POST(req: Request) {
  try { await requireRole(["staff", "admin"]); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid gojo data" }, { status: 400 });
  const session = await getOrCreateTodaySession();
  const record = await prisma.dayGojo.upsert({
    where: { sessionId_gojoId: { sessionId: session.id, gojoId: parsed.data.gojoId } },
    update: { peopleCount: parsed.data.peopleCount, seatPrice: parsed.data.seatPrice, note: parsed.data.note || null },
    create: { sessionId: session.id, gojoId: parsed.data.gojoId, peopleCount: parsed.data.peopleCount, seatPrice: parsed.data.seatPrice, note: parsed.data.note || null },
    include: { gojo: true }
  });
  return NextResponse.json({ record });
}
