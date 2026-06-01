import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data in reverse order of dependencies
  await prisma.activityCoworker.deleteMany();
  await prisma.activitySlot.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.department.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // 1. Create Roles
  const adminRole = await prisma.role.create({
    data: { name: 'Admin', description: 'Administrator role' },
  });
  const operatorRole = await prisma.role.create({
    data: { name: 'Operator', description: 'Operator role' },
  });

  // 2. Create Default Users
  const hashedPassword = await bcrypt.hash('password', 10);
  await prisma.user.create({
    data: {
      employeeId: 'EMP-1042',
      firstName: 'Admin',
      lastName: 'User',
      mobile: '9876543210',
      email: 'admin@workforce.com',
      passwordHash: hashedPassword,
      roleId: adminRole.id,
    },
  });

  await prisma.user.create({
    data: {
      employeeId: 'EMP-2001',
      firstName: 'Anita',
      lastName: 'Sharma',
      mobile: '9876543211',
      email: 'anita@workforce.com',
      passwordHash: hashedPassword,
      roleId: operatorRole.id,
    },
  });

  // 3. Create Departments
  const assemblyDept = await prisma.department.create({
    data: { name: 'Assembly', code: 'ASM', description: 'Assembly Line Department' },
  });
  const qcDept = await prisma.department.create({
    data: { name: 'Quality Control', code: 'QC', description: 'Quality Assurance & Inspection' },
  });
  const weldingDept = await prisma.department.create({
    data: { name: 'Welding', code: 'WLD', description: 'Welding and Fabrication' },
  });
  const paintingDept = await prisma.department.create({
    data: { name: 'Painting', code: 'PNT', description: 'Surface Finishing and Painting' },
  });

  // 4. Create Activities
  await prisma.activity.createMany({
    data: [
      { activityName: 'Frame Assembly', standardManMinutes: 120, departmentId: assemblyDept.id },
      { activityName: 'Wiring Harness Install', standardManMinutes: 90, departmentId: assemblyDept.id },
      { activityName: 'Visual Inspection', standardManMinutes: 45, departmentId: qcDept.id },
      { activityName: 'Quality Check', standardManMinutes: 60, departmentId: qcDept.id },
      { activityName: 'Welding Area Cleanup', standardManMinutes: 30, departmentId: weldingDept.id },
      { activityName: 'Surface Prep & Sanding', standardManMinutes: 75, departmentId: paintingDept.id },
    ],
  });

  // 5. Create Sales Orders
  await prisma.salesOrder.createMany({
    data: [
      {
        soNumber: 'SO-2025-001',
        customerName: 'Aero Dynamics Inc',
        projectName: 'Chassis Frame Assembly',
        soDescription: 'Primary chassis frame building and verification',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        status: 'ACTIVE',
      },
      {
        soNumber: 'SO-2025-002',
        customerName: 'Titanium Labs',
        projectName: 'Control Panel Assembly',
        soDescription: 'Electrical and electronics harness installation',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-10-31'),
        status: 'ACTIVE',
      },
      {
        soNumber: 'SO-2025-003',
        customerName: 'Global Heavy Industries',
        projectName: 'Heavy Structure Fabrication',
        soDescription: 'Arc welding and grinding tasks',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-09-30'),
        status: 'ACTIVE',
      },
    ],
  });

  console.log('🌱 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
