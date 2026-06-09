import "dotenv/config";
import { PrismaClient } from "@prisma/client";

if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL is missing from .env");
}

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL,
});

async function testQuery(label) {
  console.time(label);

  await prisma.order.findMany({
    take: 20,
    orderBy: {
      createdAt: "desc",
    },
  });

  console.timeEnd(label);
}

async function run() {
  try {
    console.log("Testing Supabase session pooler on port 5432...");

    await testQuery("session-first-query");
    await testQuery("session-second-query");
    await testQuery("session-third-query");
  } catch (error) {
    console.error("Session pooler test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();