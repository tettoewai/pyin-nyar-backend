import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client.js";
import * as argon2 from "argon2";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  const adminPassword = await argon2.hash("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@pyinnyar.com" },
    update: {},
    create: {
      email: "admin@pyinnyar.com",
      name: "Admin",
      userName: "admin",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
    select: {
      name: true,
      email: true,
    },
  });
  console.log(`${admin.name} was created successfully`);
}
main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
