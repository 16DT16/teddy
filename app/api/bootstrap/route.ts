import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodaySession } from "@/lib/day";

export async function GET() {
  await getOrCreateTodaySession();
  const [gojos, products] = await Promise.all([
    prisma.gojo.findMany({ where: { active: true }, orderBy: { number: "asc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);
  return NextResponse.json({ gojos, products });
}
