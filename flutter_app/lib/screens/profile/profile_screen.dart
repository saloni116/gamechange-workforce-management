import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../features/auth/domain/auth_notifier.dart';

/// Screen for viewing the worker's profile.
/// Displays worker name, Employee ID, daily hours worked (numerically and graphically),
/// activities performed, and settings.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final authState = ref.watch(authProvider);

    final employeeId = authState.employeeId ?? '—';
    final firstName = authState.firstName ?? '';
    final lastName = authState.lastName ?? '';
    final fullName = authState.fullName ?? '$firstName $lastName';
    final role = authState.role ?? 'Worker';

    // Mocked profile stats
    const String dob = 'January 15, 1995';
    const double hoursWorkedToday = 6.5;
    const int activitiesDoneToday = 3;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 100), // extra bottom padding for navbar
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ─── Header / Avatar Section ──────────────────────────────────
              Center(
                child: Column(
                  children: [
                    Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        CircleAvatar(
                          radius: 54,
                          backgroundColor: Colors.grey.shade800,
                          backgroundImage: const NetworkImage('https://i.pravatar.cc/150?img=11'),
                        ),
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Color(0xFFFF735D), // Coral
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.edit,
                            size: 18,
                            color: Colors.black,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      fullName,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      role,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.primary, // Sage Green
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // ─── Profile Details Card ──────────────────────────────────────
              Text(
                'Personal Information',
                style: theme.textTheme.titleMedium?.copyWith(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF262628),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    _InfoRow(label: 'Employee ID', value: employeeId, icon: Icons.badge_outlined),
                    const Divider(height: 24, color: Colors.white10),
                    _InfoRow(label: 'Date of Birth', value: dob, icon: Icons.cake_outlined),
                    const Divider(height: 24, color: Colors.white10),
                    _InfoRow(label: 'Department', value: 'Assembly & Testing', icon: Icons.business_outlined),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // ─── Daily Activity Statistics ─────────────────────────────────
              Text(
                'Today\'s Activity Summary',
                style: theme.textTheme.titleMedium?.copyWith(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      label: 'Hours Worked',
                      value: '$hoursWorkedToday / 8 hrs',
                      icon: Icons.timer_outlined,
                      color: const Color(0xFFFF735D),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _StatCard(
                      label: 'Activities Done',
                      value: '$activitiesDoneToday performed',
                      icon: Icons.done_all_outlined,
                      color: const Color(0xFF5C7862),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // ─── Graphical Hour Log (Weekly Breakdown) ─────────────────────
              Container(
                height: 220,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF262628),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Hours Logged This Week',
                      style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 24),
                    Expanded(
                      child: BarChart(
                        BarChartData(
                          alignment: BarChartAlignment.spaceAround,
                          maxY: 10,
                          barTouchData: BarTouchData(enabled: false),
                          titlesData: FlTitlesData(
                            show: true,
                            bottomTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                getTitlesWidget: (value, meta) {
                                  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                  if (value.toInt() >= 0 && value.toInt() < days.length) {
                                    return Padding(
                                      padding: const EdgeInsets.only(top: 8.0),
                                      child: Text(
                                        days[value.toInt()],
                                        style: const TextStyle(color: Colors.white54, fontSize: 11),
                                      ),
                                    );
                                  }
                                  return const Text('');
                                },
                              ),
                            ),
                            leftTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                reservedSize: 28,
                                getTitlesWidget: (value, meta) {
                                  if (value % 2 == 0) {
                                    return Text(
                                      '${value.toInt()}h',
                                      style: const TextStyle(color: Colors.white54, fontSize: 10),
                                    );
                                  }
                                  return const Text('');
                                },
                              ),
                            ),
                            topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          ),
                          borderData: FlBorderData(show: false),
                          gridData: FlGridData(show: false),
                          barGroups: [
                            _makeBarGroup(0, 8.0, const Color(0xFF5C7862)),
                            _makeBarGroup(1, 7.5, const Color(0xFF5C7862)),
                            _makeBarGroup(2, 8.5, const Color(0xFF5C7862)),
                            _makeBarGroup(3, 6.0, const Color(0xFF5C7862)),
                            _makeBarGroup(4, hoursWorkedToday, const Color(0xFFFF735D)), // Today highlighted in Coral
                            _makeBarGroup(5, 0.0, const Color(0xFF5C7862)),
                            _makeBarGroup(6, 0.0, const Color(0xFF5C7862)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // ─── Actions / Sign Out ────────────────────────────────────────
              ElevatedButton.icon(
                onPressed: () {
                  ref.read(authProvider.notifier).logout();
                },
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Sign Out'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF735D).withOpacity(0.15),
                  foregroundColor: const Color(0xFFFF735D),
                  side: const BorderSide(color: Color(0xFFFF735D), width: 1),
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  BarChartGroupData _makeBarGroup(int x, double y, Color barColor) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: barColor,
          width: 14,
          borderRadius: const BorderRadius.all(Radius.circular(6)),
          backDrawRodData: BackgroundBarChartRodData(
            show: true,
            toY: 8,
            color: Colors.white.withOpacity(0.05),
          ),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Helper UI Widgets
// ══════════════════════════════════════════════════════════════════════════
class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, color: Colors.grey.shade400, size: 20),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade500,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF262628),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 12),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: Colors.grey.shade500,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: theme.textTheme.titleMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}
