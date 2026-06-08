require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const isMatch = await bcrypt.compare('admin123', user.passwordHash);
    if (isMatch) {
      console.log(`Password 'admin123' matches for user: ${user.employeeId} (${user.email})`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
