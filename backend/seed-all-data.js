const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Starting full database seed...');

    // Truncate tables with relations to ensure clean 3-role state
    console.log('Truncating tables...');
    await prisma.activitySlot.deleteMany();
    await prisma.activityAttachment.deleteMany();
    await prisma.activityCoworker.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.sODepartmentActivity.deleteMany();
    await prisma.sODepartment.deleteMany();
    await prisma.salesOrder.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
    await prisma.roleActivity.deleteMany();
    await prisma.role.deleteMany();

    // 1. Seed Roles
    const roleNames = ['Admin', 'Skilled', 'Trainee'];
    const roles = {};
    for (const name of roleNames) {
      roles[name] = await prisma.role.create({
        data: {
          name,
          description: `${name} role`,
          isActive: true,
          isDeleted: false,
        },
      });
    }
    console.log('Roles seeded successfully.');

    // 2. Seed Users
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    const admin001Hash = await bcrypt.hash('SYS001', 10);

    const baseUsersData = [
      { employeeId: 'ADMIN001', firstName: 'System', lastName: 'Admin', mobile: '9000000001', email: 'systemadmin@workforce.com', role: 'Admin', hash: admin001Hash },
      { employeeId: 'EMP-1042', firstName: 'Admin', lastName: 'User', mobile: '9876543210', email: 'admin@workforce.com', role: 'Admin', hash: passwordHash },
      { employeeId: 'EMP-2001', firstName: 'Anita', lastName: 'Sharma', mobile: '9876543211', email: 'anita@workforce.com', role: 'Skilled', hash: passwordHash },
      { employeeId: 'EMP-1990', firstName: 'Harshada', lastName: 'Amrolkar', mobile: '4548512121', email: 'harshada@workforce.com', role: 'Skilled', hash: passwordHash },
      { employeeId: 'EMP-2003', firstName: 'Saloni', lastName: 'More', mobile: '7852446876', email: 'saloni@workforce.com', role: 'Trainee', hash: passwordHash },
      { employeeId: 'EMP-2002', firstName: 'Samarth', lastName: 'Anandrao', mobile: '7258945612', email: 'samarth@workforce.com', role: 'Trainee', hash: passwordHash },
      { employeeId: 'MGR001', firstName: 'Kavita', lastName: 'Reddy', mobile: '9876543225', email: 'kavita@workforce.com', role: 'Trainee', hash: passwordHash },
      { employeeId: 'SUPER001', firstName: 'Vikram', lastName: 'Singh', mobile: '9876543224', email: 'vikram@workforce.com', role: 'Trainee', hash: passwordHash },
      { employeeId: 'TRAINEE002', firstName: 'Sunita', lastName: 'Rao', mobile: '9876543223', email: 'sunita@workforce.com', role: 'Trainee', hash: passwordHash },
      { employeeId: 'SKILLED002', firstName: 'Amit', lastName: 'Patel', mobile: '9876543222', email: 'amit@workforce.com', role: 'Skilled', hash: passwordHash },
      { employeeId: 'TRAINEE001', firstName: 'Priya', lastName: 'Sharma', mobile: '9876543221', email: 'priya@workforce.com', role: 'Trainee', hash: passwordHash },
      { employeeId: 'SKILLED001', firstName: 'Rajesh', lastName: 'Kumar', mobile: '9876543220', email: 'rajesh@workforce.com', role: 'Skilled', hash: passwordHash },
    ];

    const extraUsersData = [
      { employeeId: 'FTC016', firstName: 'SHASHANK', lastName: 'MAPANKAR', mobile: '9819645785', pass: 'SHA785', role: 'Skilled' },
      { employeeId: 'FTC039', firstName: 'SANJAY', lastName: 'PARAB', mobile: '9820691714', pass: 'SAN714', role: 'Skilled' },
      { employeeId: 'FTC038', firstName: 'DINESH', lastName: 'SHIGWAN', mobile: '8369614690', pass: 'DIN690', role: 'Skilled' },
      { employeeId: 'FTC033', firstName: 'VISHVAJIT', lastName: 'LINGAYAT', mobile: '8369192042', pass: 'VIS042', role: 'Skilled' },
      { employeeId: 'FTC002', firstName: 'SUHAS', lastName: 'BALIP', mobile: '9821825044', pass: 'SUH044', role: 'Skilled' },
      { employeeId: 'FTC014', firstName: 'BHARAT', lastName: 'JADHAV', mobile: '7021600762', pass: 'BHA762', role: 'Skilled' },
      { employeeId: 'FTC0012', firstName: 'SATISH', lastName: 'RANE', mobile: '9867180614', pass: 'SAT614', role: 'Skilled' },
      { employeeId: 'FTC003', firstName: 'SHASHIKAN', lastName: 'GUPTA', mobile: '9029440502', pass: 'SHA502', role: 'Skilled' },
      { employeeId: 'FTC056', firstName: 'SAGAR', lastName: 'PAWAR', mobile: '7769941140', pass: 'SAG140', role: 'Skilled' },
      { employeeId: 'FTC028', firstName: 'Sanket', lastName: 'Manchekar', mobile: '750620993', pass: 'SAN993', role: 'Skilled' },
      { employeeId: 'FTC085', firstName: 'Tejas', lastName: 'Dhukhande', mobile: '8169825345', pass: 'TEJ345', role: 'Skilled' },
    ];

    const usersData = [...baseUsersData];
    for (const u of extraUsersData) {
      const hash = await bcrypt.hash(u.pass, 10);
      usersData.push({
        employeeId: u.employeeId,
        firstName: u.firstName,
        lastName: u.lastName,
        mobile: u.mobile,
        email: null,
        role: u.role,
        hash
      });
    }

    const users = {};
    for (const u of usersData) {
      users[u.employeeId] = await prisma.user.upsert({
        where: { employeeId: u.employeeId },
        update: {
          firstName: u.firstName,
          lastName: u.lastName,
          mobile: u.mobile,
          email: u.email,
          roleId: roles[u.role].id,
          passwordHash: u.hash,
          isActive: true,
          isDeleted: false,
        },
        create: {
          employeeId: u.employeeId,
          firstName: u.firstName,
          lastName: u.lastName,
          mobile: u.mobile,
          email: u.email,
          roleId: roles[u.role].id,
          passwordHash: u.hash,
          isActive: true,
          isDeleted: false,
        },
      });
    }
    console.log('Users seeded successfully.');

    // 3. Seed Departments & Activities
    const departmentsData = [
      { name: 'DISPATCH', code: 'DSP', desc: 'Dispatch department', activities: [
        { name: 'JOB SHIFTING & ARRANGE FOR PACKING', minutes: 200 },
        { name: 'MOUNT ON WOODEN CASE', minutes: 200 },
        { name: 'PACKING', minutes: 200 },
        { name: 'LOADING ON TRAILOR', minutes: 200 },
        { name: 'LOCKING ON VAHICLE', minutes: 200 },
      ]},
      { name: 'OTHER', code: 'OTH', desc: 'Other activities department', activities: [
        { name: 'HARDWARE SHORTING', minutes: 200 },
        { name: 'JOB SHIFTING (NOT FOR WORKING ON SAME JOB)', minutes: 200 },
        { name: 'HOUSEKEEPING', minutes: 200 },
        { name: 'MACHINE CLEANING', minutes: 200 },
        { name: 'WINDING REPAIR', minutes: 200 },
        { name: 'CA REPAIR', minutes: 200 },
        { name: 'CCA REPAIR', minutes: 200 },
        { name: 'TANKING REPAIR', minutes: 200 },
        { name: 'REPAINTING', minutes: 200 },
        { name: 'SHIFT TO TESTING', minutes: 200 },
        { name: 'READY FOR TESTING', minutes: 200 },
        { name: 'REMOVE FROM TESTING', minutes: 200 },
        { name: '5 S IMPLIMENTATION', minutes: 200 },
        { name: 'QUALITY CIRCLE WORK', minutes: 200 },
        { name: 'SORTED MATERIAL RETURN TO STORE', minutes: 200 },
        { name: 'ON JOB TRANNING', minutes: 200 },
        { name: 'ROOM TRANNING', minutes: 200 },
        { name: 'WORK IN OTHER DEPT', minutes: 200 },
      ]},
      { name: 'PRESSURE TEST', code: 'PRT', desc: 'Pressure testing department', activities: [
        { name: 'JOB SHIFT FOR PRESSURE TEST', minutes: 200 },
        { name: 'OIL FILLING & PRESSURE TEST', minutes: 200 },
        { name: 'PRESSURE MONITERING', minutes: 200 },
        { name: 'OIL DRAIN & N2 FILLING', minutes: 200 },
      ]},
      { name: 'PAINTING', code: 'PTG', desc: 'Painting department', activities: [
        { name: 'SHIFT TO PAINTING AREA', minutes: 200 },
        { name: 'SANDING & POLISHING FOR PAINTING', minutes: 200 },
        { name: 'MASKING FOR PRIMER APPLY', minutes: 200 },
        { name: 'PRIMER APPLY', minutes: 200 },
        { name: 'MASKING FOR PAINTING', minutes: 200 },
        { name: 'PAINTING', minutes: 200 },
        { name: 'REMOVE FROM PAINTING', minutes: 200 },
      ]},
      { name: 'FINISHING', code: 'FIN', desc: 'Finishing department', activities: [
        { name: 'JOB CLEANING', minutes: 200 },
        { name: 'STICKER PASTING', minutes: 200 },
        { name: 'CABINET HARDWARE TIGHTNING', minutes: 200 },
        { name: 'ALL EXTERNAL HARWARE TOURQUE MARKING', minutes: 200 },
        { name: 'CHECK OIL LEVEL & N2 MONITERING', minutes: 200 },
        { name: 'BRUSH PAINT TOUCHUP', minutes: 200 },
        { name: 'TAKE PHOTOS & QC CHECK', minutes: 200 },
        { name: 'READY FOR FAT', minutes: 200 },
        { name: 'READY FOR DISPATCH', minutes: 200 },
        { name: 'IMPENDANCE & DATE PUNCHING', minutes: 200 },
        { name: 'R&D/MONOGRAM/ WIRING PLATE MOUNTING', minutes: 200 },
        { name: 'PENTA HEAD BOLT LOCKING', minutes: 200 },
        { name: 'ALL ACC CHECK AS PER DRAWINGS', minutes: 200 },
        { name: 'JOB TARPOLIN FIXING', minutes: 200 },
      ]},
      { name: 'TRAIL TANKING', code: 'TTK', desc: 'Trail tanking department', activities: [
        { name: 'MATERIAL COLLECT FROM STORE', minutes: 200 },
        { name: 'TANK CLEANING', minutes: 200 },
        { name: 'ACC MOUNTING', minutes: 200 },
        { name: 'TRIAL TANKING & LV CONNECTION CHECK', minutes: 200 },
        { name: 'BAL TRIAL TANKING WORK & REMOVE FROM TANK', minutes: 200 },
        { name: 'RADIATOR MOUNTING', minutes: 200 },
        { name: 'RADIATOR TIEBAR & TIEROD FIXING', minutes: 200 },
      ]},
      { name: 'TANKING', code: 'TNK', desc: 'Tanking department', activities: [
        { name: 'REMOVE FROM OVEN & TESTING CHECK', minutes: 200 },
        { name: 'BOTTOM SHRINKAGE', minutes: 200 },
        { name: 'TOP SHRINKAGE', minutes: 200 },
        { name: 'LV-HV CONNECTION TIGHTNING', minutes: 200 },
        { name: 'FINISHING LEAD ROUTING/ TOURQUE MARKING', minutes: 200 },
        { name: 'QC/TESTING CHECK', minutes: 200 },
        { name: 'CCA/TANK SHIFTNG', minutes: 200 },
        { name: 'BUSBAR REMOVE FOR TANKING', minutes: 200 },
        { name: 'CCA TANKING', minutes: 200 },
        { name: 'LV CONNECTION IN TANK', minutes: 200 },
        { name: 'HV CONNECTION IN TANK', minutes: 200 },
        { name: 'EXPULSION CONNECTION IN TANK', minutes: 200 },
        { name: 'CCA LOCKING WITH EARTHING', minutes: 200 },
        { name: 'TESTING CHECK', minutes: 200 },
        { name: 'PRD/QC CHECK', minutes: 200 },
        { name: 'TOP COVER FIXING FOR VACCUME', minutes: 200 },
        { name: 'VACCUME APPLY', minutes: 200 },
        { name: 'VACCUME MONITERING & OFFER FOR OIL FILLING', minutes: 200 },
        { name: 'CHECK OIL LEVEL & SHIFT IN TESTING', minutes: 200 },
        { name: 'REMOVE FROM TESTING', minutes: 200 },
        { name: 'ARRANGE FOR OIL REPLACE/ FILTRATION', minutes: 200 },
        { name: 'CONDENSER BUSHING MOUNTING', minutes: 200 },
        { name: 'CONDENSER BUSHING REMOVING', minutes: 200 },
        { name: 'BALANCE MATERIAL RETURN TO STORE', minutes: 200 },
      ]},
      { name: 'WELDING', code: 'WLD', desc: 'Welding department', activities: [
        { name: 'REMOVE TOP COVER & REMOVE STICKER', minutes: 200 },
        { name: 'GLASS WOOLEN CUTTING & PASTING & ARRANGE', minutes: 200 },
        { name: 'TOP COVER WELDING (1/2)', minutes: 200 },
        { name: 'BALANCE TOP COVER WELDING', minutes: 200 },
        { name: 'WELDED TOP COVER GRANDING', minutes: 200 },
        { name: 'JOB & TOP COVER CLEANING', minutes: 200 },
      ]},
      { name: 'COIL COLD CLAMPING', code: 'CCC', desc: 'Coil cold clamping department', activities: [
        { name: 'CHANNEL & COIL COLLECT', minutes: 200 },
        { name: '3 COIL ARRANGE IN CHANNEL', minutes: 200 },
        { name: 'COIL COLD CLAMPING', minutes: 200 },
        { name: 'PRD/QC DIAMENTION CHECK', minutes: 200 },
        { name: 'ARRANGE ON WDG OVEN TRALLOY', minutes: 200 },
        { name: 'REMOVE FROM OVEN & DIAMNENTION CHECK', minutes: 200 },
      ]},
      { name: 'CORE ASSEMBLY', code: 'CAS', desc: 'Core assembly department', activities: [
        { name: 'MATERIAL COLLECT FROM STORE', minutes: 200 },
        { name: 'CORE PALLET ARRANGE', minutes: 200 },
        { name: 'CORE STACKING FROM PALLET', minutes: 200 },
        { name: 'FRAME LAYING & SETTING', minutes: 200 },
        { name: 'INSULATION ARRANGE', minutes: 200 },
        { name: 'CORE ASSLY STACKING (MM OK)', minutes: 200 },
        { name: 'TOP FRAME & STAP BLOCK INSULATION ARRANGE', minutes: 200 },
        { name: 'TOP FRAME LAYING & TIGHTNING', minutes: 200 },
        { name: 'BASE PATTI TIGHTNING', minutes: 200 },
        { name: 'PAINT & LACHER PASTING', minutes: 200 },
        { name: 'CORE UPENDING', minutes: 200 },
        { name: 'READY FOR NO LOAD TEST', minutes: 200 },
        { name: 'CORE SHIFT IN TESTING', minutes: 200 },
        { name: 'CORE REMOVE FROM TESTING & ARRANGE IN ASSLY', minutes: 200 },
        { name: 'ARRALDITE PASTING', minutes: 200 },
        { name: 'BALANCE MATERIAL RETURN TO STORE', minutes: 200 },
      ]},
      { name: 'COIL CORE ASSEMBLY (CCA)', code: 'CCA', desc: 'Coil core assembly department', activities: [
        { name: 'MATERIAL COLLECT FROM STORE', minutes: 200 },
        { name: 'CORE CHECK & ARRANGE', minutes: 200 },
        { name: 'LV COIL LOADING', minutes: 200 },
        { name: 'HV COIL LOADING', minutes: 200 },
        { name: 'COIL CENTERING & SETTING', minutes: 200 },
        { name: 'LEAD CONNECTION ARRANGEMENT', minutes: 200 },
        { name: 'TAP LEAD ARRANGEMENT', minutes: 200 },
        { name: 'LEAD BRAZING', minutes: 200 },
        { name: 'INSULATION ARRANGEMENT', minutes: 200 },
        { name: 'CLAMPING & TIGHTENING', minutes: 200 },
        { name: 'PRD/QC CHECK', minutes: 200 },
        { name: 'CCA READY FOR DRYING', minutes: 200 },
        { name: 'BALANCE MATERIAL RETURN TO STORE', minutes: 200 },
      ]},
      { name: 'INSULATION', code: 'INS', desc: 'Insulation department', activities: [
        { name: 'LV CYLENDER CUTTING', minutes: 120 },
        { name: 'HV CYLENDER CUTTING', minutes: 90 },
        { name: 'EARTHING SHIELD CUTTING', minutes: 30 },
        { name: 'END COLLER CUTTING', minutes: 200 },
        { name: 'COOLING CANAL CUTTING', minutes: 200 },
        { name: 'LV COOLING CANAL PASTING', minutes: 200 },
        { name: 'HV COOLING CANAL PASTING', minutes: 200 },
        { name: 'HILO & HV OUTER COOLING CANAL PASTING', minutes: 200 },
        { name: 'LV WINDING BUSBAR BENDING & PUNCHING', minutes: 200 },
        { name: 'NOMEX PAPER CUTTING FOR LV BUSBAR', minutes: 200 },
        { name: 'MATERIAL ARRANGE ON STAND & LOAD ON OVEN', minutes: 200 },
        { name: 'MATERIAL REMOVE FROM OVEN & OIL DIPPING', minutes: 200 },
        { name: 'REMOVE FROM OIL & ARRANGE IN TRAY', minutes: 200 },
        { name: 'BALANCE MATERIAL RETURN TO STORE', minutes: 200 },
      ]},
      { name: 'LV FOIL WINDING', code: 'LFW', desc: 'LV foil winding department', activities: [
        { name: 'MATERIAL COLLECT FROM STORE', minutes: 200 },
        { name: 'CHECKED & LOADED ON MACHINE', minutes: 200 },
        { name: 'FORMER ASSEMBLY', minutes: 200 },
        { name: 'FORMER LOADING & SETTING', minutes: 200 },
        { name: 'CYLENDER ARRANGE & PASTING', minutes: 200 },
        { name: 'START BUSBAR BRAZING & INSULATING', minutes: 200 },
        { name: 'WINDING START & 1/2 WINDING COMPLITED', minutes: 200 },
        { name: 'BAL 1/2 WINDING TO END BUSBAR BRAZING', minutes: 200 },
        { name: 'COIL FINISH & OK FROM PRD/QA', minutes: 200 },
        { name: 'HI-LO COMPLETION', minutes: 200 },
        { name: 'PRD/QC CHECK & UNLOADING & STORE', minutes: 200 },
        { name: 'BALANCE MATERIAL RETURN TO STORE', minutes: 200 },
      ]},
      { name: 'HV LAYER WINDING', code: 'HLW', desc: 'HV layer winding department', activities: [
        { name: 'MATERIAL COLLECT FROM STORE', minutes: 200 },
        { name: 'MATERIAL CHECKED & LOADED ON MACHINE', minutes: 200 },
        { name: 'FORMER ASSEMBLY', minutes: 200 },
        { name: 'COIL LOADING & SETTING', minutes: 200 },
        { name: 'WINDING START TO 4 LAYER', minutes: 200 },
        { name: '4 LAYER TO 8 LAYER WINDING', minutes: 200 },
        { name: '8 LAYER TO 12 LAYER WINDING', minutes: 200 },
        { name: '12 LAYER TO 16 LAYER WINDING', minutes: 200 },
        { name: '16 LAYER TO 20 LAYER WINDING', minutes: 200 },
        { name: '20 LAYER TO 24 LAYER WINDING', minutes: 200 },
        { name: '24 LAYER TO 28 LAYER WINDING', minutes: 200 },
        { name: '1-3 TAPS BRAZING', minutes: 200 },
        { name: '3-6 TAPS BRAZING', minutes: 200 },
        { name: 'TRANSPOSITON IN LAYER WINDING', minutes: 200 },
        { name: 'HV CYLENDER ARRANGE & PASTING', minutes: 200 },
        { name: 'WINDING PRD/QC CHECK', minutes: 200 },
        { name: 'WINDING UNLOADING & STORE', minutes: 200 },
        { name: 'BALANCE MATERIAL RETURN TO STORE', minutes: 200 },
      ]}
    ];

    const departments = {};
    const activities = {};

    for (const d of departmentsData) {
      const dept = await prisma.department.upsert({
        where: { code: d.code },
        update: { name: d.name, description: d.desc, isActive: true, isDeleted: false },
        create: {
          name: d.name,
          code: d.code,
          description: d.desc,
          isActive: true,
          isDeleted: false,
        },
      });
      departments[d.name] = dept;

      activities[d.name] = {};
      for (const a of d.activities) {
        const act = await prisma.activity.findFirst({
          where: { activityName: a.name, departmentId: dept.id },
        });

        if (act) {
          activities[d.name][a.name] = await prisma.activity.update({
            where: { id: act.id },
            data: { standardManMinutes: a.minutes, isActive: true, isDeleted: false },
          });
        } else {
          activities[d.name][a.name] = await prisma.activity.create({
            data: {
              activityName: a.name,
              standardManMinutes: a.minutes,
              departmentId: dept.id,
              isActive: true,
              isDeleted: false,
            },
          });
        }
      }
    }
    console.log('Departments & Activities seeded successfully.');

    // 4. Seed Sales Orders
    const salesOrdersData = [
      {
        soNumber: 'SO-2025-001',
        customerName: 'AERO DYNAMICS INC',
        projectName: 'Chassis Frame Assembly',
        soDescription: 'Primary chassis frame building and verification',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        status: 'IN_PROGRESS',
        mappings: [
          { dept: 'DISPATCH', acts: ['JOB SHIFTING & ARRANGE FOR PACKING', 'PACKING'] },
          { dept: 'OTHER', acts: ['HOUSEKEEPING', '5 S IMPLIMENTATION'] },
        ],
      },
      {
        soNumber: 'SO-2025-002',
        customerName: 'TITANIUM LABS',
        projectName: 'Control Panel Assembly',
        soDescription: 'Electrical and electronics harness installation',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-10-31'),
        status: 'IN_PROGRESS',
        mappings: [
          { dept: 'DISPATCH', acts: ['MOUNT ON WOODEN CASE'] },
          { dept: 'OTHER', acts: ['MACHINE CLEANING'] },
        ],
      },
      {
        soNumber: 'SO-2025-003',
        customerName: 'GLOBAL HEAVY INDUSTRIES',
        projectName: 'Heavy Structure Fabrication',
        soDescription: 'Arc welding and grinding tasks',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-09-30'),
        status: 'IN_PROGRESS',
        mappings: [
          { dept: 'DISPATCH', acts: ['LOADING ON TRAILOR'] },
          { dept: 'OTHER', acts: ['WINDING REPAIR'] },
        ],
      },
    ];

    const salesOrders = {};
    for (const sod of salesOrdersData) {
      const so = await prisma.salesOrder.upsert({
        where: { soNumber: sod.soNumber },
        update: {
          customerName: sod.customerName,
          projectName: sod.projectName,
          soDescription: sod.soDescription,
          startDate: sod.startDate,
          endDate: sod.endDate,
          status: sod.status,
          isActive: true,
          isDeleted: false,
        },
        create: {
          soNumber: sod.soNumber,
          customerName: sod.customerName,
          projectName: sod.projectName,
          soDescription: sod.soDescription,
          startDate: sod.startDate,
          endDate: sod.endDate,
          status: sod.status,
          isActive: true,
          isDeleted: false,
        },
      });
      salesOrders[sod.soNumber] = so;

      // Create SODepartment & SODepartmentActivity mappings
      for (const m of sod.mappings) {
        const dept = departments[m.dept];
        const soDept = await prisma.sODepartment.upsert({
          where: { soId_departmentId: { soId: so.id, departmentId: dept.id } },
          update: {},
          create: {
            soId: so.id,
            departmentId: dept.id,
          },
        });

        for (const actName of m.acts) {
          const act = activities[m.dept][actName];
          await prisma.sODepartmentActivity.upsert({
            where: { soDepartmentId_activityId: { soDepartmentId: soDept.id, activityId: act.id } },
            update: {},
            create: {
              soDepartmentId: soDept.id,
              activityId: act.id,
            },
          });
        }
      }
    }
    console.log('Sales Orders and mapping relationships seeded successfully.');

    // 5. Seed Activity Logs & Slots (to show historical productivity on dashboard charts)
    // We will delete existing logs to ensure clean mock tracking
    await prisma.activitySlot.deleteMany();
    await prisma.activityAttachment.deleteMany();
    await prisma.activityCoworker.deleteMany();
    await prisma.activityLog.deleteMany();

    const loggedUsers = ['EMP-2001', 'EMP-1990', 'EMP-2003', 'EMP-2002'];
    const activeSO = salesOrders['SO-2025-001'];
    const deptDispatch = departments['DISPATCH'];
    const actPacking = activities['DISPATCH']['PACKING'];

    const logDates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      logDates.push(d);
    }

    console.log('Seeding activity logs and productivity trends...');
    for (let i = 0; i < logDates.length; i++) {
      const date = logDates[i];
      // Create some logs for each day
      for (const empId of loggedUsers) {
        const user = users[empId];
        
        // Log packing
        const log = await prisma.activityLog.create({
          data: {
            userId: user.id,
            soId: activeSO.id,
            departmentId: deptDispatch.id,
            activityId: actPacking.id,
            activityDate: date,
            status: 'COMPLETED',
            remarks: 'Seeded completed activity task log.',
            isOtherActivity: false,
          },
        });

        // Add a slot with duration
        // standard time is 200 mins. Let's make actual duration vary to show productivity (90% - 100%)
        const durationMinutes = 180 + Math.floor(Math.random() * 30); // 180 to 210 minutes
        await prisma.activitySlot.create({
          data: {
            activityLogId: log.id,
            startTime: new Date(date.setHours(9, 0, 0)),
            endTime: new Date(date.setHours(9, durationMinutes, 0)),
            durationMinutes,
          },
        });
      }
    }

    console.log('Activity logs and productivity trend data seeded successfully.');
    console.log('Full Database Seeding Complete. Everything aligned neatly!');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
