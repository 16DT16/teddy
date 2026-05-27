import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  for (let i = 1; i <= 15; i++) {
    await prisma.gojo.upsert({
      where: { number: i },
      update: { name: `Gojo ${i}`, active: true },
      create: { number: i, name: `Gojo ${i}`, active: true }
    });
  }

  const products = [
    { name: "Buna", category: "Hot Drink", price: "30", unit: "cup", sortOrder: 1 },
    { name: "Tea", category: "Hot Drink", price: "25", unit: "cup", sortOrder: 2 },
    { name: "Coca-Cola", category: "Soft Drink", price: "50", unit: "bottle", sortOrder: 3 },
    { name: "Water", category: "Soft Drink", price: "25", unit: "bottle", sortOrder: 4 },
    { name: "Macchiato", category: "Hot Drink", price: "45", unit: "cup", sortOrder: 5 },
    { name: "Sambusa", category: "Food", price: "35", unit: "piece", sortOrder: 6 }
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: product });
    } else {
      await prisma.product.create({ data: product });
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.daySession.upsert({
    where: { businessDate: today },
    update: {},
    create: { businessDate: today, status: "OPEN", defaultSeatPrice: 0 }
  });
}

main().finally(async () => prisma.$disconnect());
