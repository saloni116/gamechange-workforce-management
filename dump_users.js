require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { role: true } });
  console.log(users.map(u => ({
    employeeId: u.employeeId,
    email: u.email,
    name: u.firstName,
    role: u.role.name
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
