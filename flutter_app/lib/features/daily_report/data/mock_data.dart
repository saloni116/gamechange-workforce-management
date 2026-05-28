/// Mock data for the Daily Report feature.
///
/// Contains hardcoded departments, activities, sales orders,
/// and a coworker directory for development and testing.
library;

// ---------------------------------------------------------------------------
// Department
// ---------------------------------------------------------------------------

class Department {
  final String id;
  final String name;

  const Department({required this.id, required this.name});
}

const List<Department> mockDepartments = [
  Department(id: 'DEPT-01', name: 'Assembly'),
  Department(id: 'DEPT-02', name: 'Welding'),
  Department(id: 'DEPT-03', name: 'Quality Control'),
  Department(id: 'DEPT-04', name: 'Painting'),
];

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

class Activity {
  final String id;
  final String activityCode;
  final String activityName;
  final String departmentId;
  final double standardManMinutes;
  final bool isInRole;

  const Activity({
    required this.id,
    required this.activityCode,
    required this.activityName,
    required this.departmentId,
    required this.standardManMinutes,
    required this.isInRole,
  });
}

const List<Activity> mockActivities = [
  // ── Assembly (DEPT-01) ────────────────────────────────────────────────
  Activity(
    id: 'ACT-001',
    activityCode: 'ASM-100',
    activityName: 'Frame Assembly',
    departmentId: 'DEPT-01',
    standardManMinutes: 45,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-002',
    activityCode: 'ASM-101',
    activityName: 'Wiring Harness Install',
    departmentId: 'DEPT-01',
    standardManMinutes: 30,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-003',
    activityCode: 'ASM-199',
    activityName: 'General Assembly Support',
    departmentId: 'DEPT-01',
    standardManMinutes: 60,
    isInRole: false, // ← triggers Other Activity rule
  ),

  // ── Welding (DEPT-02) ─────────────────────────────────────────────────
  Activity(
    id: 'ACT-004',
    activityCode: 'WLD-200',
    activityName: 'MIG Welding',
    departmentId: 'DEPT-02',
    standardManMinutes: 50,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-005',
    activityCode: 'WLD-201',
    activityName: 'TIG Welding',
    departmentId: 'DEPT-02',
    standardManMinutes: 55,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-006',
    activityCode: 'WLD-299',
    activityName: 'Welding Area Cleanup',
    departmentId: 'DEPT-02',
    standardManMinutes: 20,
    isInRole: false, // ← triggers Other Activity rule
  ),

  // ── Quality Control (DEPT-03) ─────────────────────────────────────────
  Activity(
    id: 'ACT-007',
    activityCode: 'QC-300',
    activityName: 'Visual Inspection',
    departmentId: 'DEPT-03',
    standardManMinutes: 25,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-008',
    activityCode: 'QC-301',
    activityName: 'Dimensional Check',
    departmentId: 'DEPT-03',
    standardManMinutes: 35,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-009',
    activityCode: 'QC-302',
    activityName: 'Stress Test',
    departmentId: 'DEPT-03',
    standardManMinutes: 40,
    isInRole: true,
  ),

  // ── Painting (DEPT-04) ────────────────────────────────────────────────
  Activity(
    id: 'ACT-010',
    activityCode: 'PNT-400',
    activityName: 'Surface Prep & Sanding',
    departmentId: 'DEPT-04',
    standardManMinutes: 30,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-011',
    activityCode: 'PNT-401',
    activityName: 'Spray Painting',
    departmentId: 'DEPT-04',
    standardManMinutes: 40,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-012',
    activityCode: 'PNT-499',
    activityName: 'Paint Booth Maintenance',
    departmentId: 'DEPT-04',
    standardManMinutes: 60,
    isInRole: false, // ← triggers Other Activity rule
  ),
];

// ---------------------------------------------------------------------------
// Sales Orders
// ---------------------------------------------------------------------------

class SalesOrder {
  final String id;
  final String label;

  const SalesOrder({required this.id, required this.label});
}

const List<SalesOrder> mockSalesOrders = [
  SalesOrder(id: 'SO-2025-001', label: 'SO-2025-001'),
  SalesOrder(id: 'SO-2025-002', label: 'SO-2025-002'),
  SalesOrder(id: 'SO-2025-003', label: 'SO-2025-003'),
  SalesOrder(id: 'SO-2025-004', label: 'SO-2025-004'),
];

// ---------------------------------------------------------------------------
// Coworker Directory (for mock verification)
// ---------------------------------------------------------------------------

class Coworker {
  final String employeeId;
  final String name;
  final String department;

  const Coworker({
    required this.employeeId,
    required this.name,
    required this.department,
  });
}

/// Mock directory used by [DailyReportNotifier.verifyCoworker] to simulate
/// an employee lookup.
const List<Coworker> mockCoworkerDirectory = [
  Coworker(employeeId: 'EMP-1042', name: 'Rajesh Kumar', department: 'Assembly'),
  Coworker(employeeId: 'EMP-2011', name: 'Anita Sharma', department: 'Welding'),
  Coworker(employeeId: 'EMP-3087', name: 'Vikram Patel', department: 'Quality Control'),
  Coworker(employeeId: 'EMP-4056', name: 'Priya Desai', department: 'Painting'),
];
