require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt'); // password.util.ts likely uses bcrypt
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { employeeId: 'ADMIN001' } });
  if (user) {
    console.log('User found:', user.employeeId, user.passwordHash);
    const passwordsToTest = ['admin123', 'password', 'admin', '123456'];
    for (const p of passwordsToTest) {
      const isMatch = await bcrypt.compare(p, user.passwordHash);
      console.log(`Testing '${p}':`, isMatch);
    }
  } else {
    console.log('User ADMIN001 not found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
