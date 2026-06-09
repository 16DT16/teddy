import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  try {
    console.time("first-query");

    await prisma.order.findMany({
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
    });

    console.timeEnd("first-query");

    console.time("second-query");

    await prisma.order.findMany({
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
    });

    console.timeEnd("second-query");

    console.time("third-query");

    await prisma.order.findMany({
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
    });

    console.timeEnd("third-query");
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();