const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== SALES ORDERS ===");
  const salesOrders = await prisma.salesOrder.findMany();
  console.log(JSON.stringify(salesOrders, null, 2));

  console.log("\n=== DEPARTMENTS & ACTIVITIES ===");
  const departments = await prisma.department.findMany({
    include: { activities: true }
  });
  console.log(JSON.stringify(departments, null, 2));

  console.log("\n=== USERS ===");
  const users = await prisma.user.findMany({
    include: { role: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
