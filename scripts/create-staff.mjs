import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "staff";
  const password = "change-this-password";

  const passwordHash = await bcrypt.hash(password, 12);

  const staff = await prisma.staffAccount.upsert({
    where: {
      username,
    },
    update: {
      passwordHash,
    },
    create: {
      username,
      passwordHash,
    },
  });

  console.log("Staff account created:", {
    id: staff.id,
    username: staff.username,
  });
}

main()
  .catch((error) => {
    console.error("Failed to create staff account:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });