import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../auth/domain/auth_provider.dart';
import '../../daily_report/domain/logged_activity.dart';
import '../../daily_report/domain/activity_history_provider.dart';

/// The new home screen dashboard for the user.
/// Displays daily activity stats, charts, and a quick action button.
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final authState = ref.watch(authProvider);
    final userName = authState.employeeId ?? 'User';

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ─── Header ───────────────────────────────────────────────────
              _CustomHeader(userName: userName),
              const SizedBox(height: 24),

              // ─── Quick Actions ────────────────────────────────────────────
              _NewActivityActionCard(
                onTap: () => context.push(AppRoutes.newActivity),
              ),
              const SizedBox(height: 32),

              // ─── Statistics Header ────────────────────────────────────────
              Text(
                'Your Statistics',
                style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
              ),
              const SizedBox(height: 16),

              // ─── Productivity Graph ───────────────────────────────────────
              const _ProductivityGraphCard(),
              const SizedBox(height: 16),

              // ─── Time Distribution Pie Chart ──────────────────────────────
              const _TimeDistributionPieCard(),
              const SizedBox(height: 32),

              // ─── Recent Activities Header ─────────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Daily Activities Done',
                    style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
                  ),
                  GestureDetector(
                    onTap: () => context.push(AppRoutes.history),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                      child: Text(
                        'See all >',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // ─── Mocked Activity List ─────────────────────────────────────
              const _ActivityList(),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Custom Header
// ══════════════════════════════════════════════════════════════════════════
class _CustomHeader extends StatelessWidget {
  const _CustomHeader({required this.userName});
  final String userName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        CircleAvatar(
          radius: 24,
          backgroundColor: Colors.grey.shade800,
          backgroundImage: const NetworkImage('https://i.pravatar.cc/150?img=11'),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome back',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade400,
                  fontSize: 14,
                ),
              ),
              Text(
                userName,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontSize: 18,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          icon: const Icon(Icons.notifications_none),
          color: Colors.white,
          onPressed: () {},
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  New Activity Action Card
// ══════════════════════════════════════════════════════════════════════════
class _NewActivityActionCard extends StatelessWidget {
  const _NewActivityActionCard({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: theme.colorScheme.primary, // Sage Green
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ready to log\na new activity?',
                    style: theme.textTheme.titleLarge?.copyWith(
                      color: Colors.white,
                      fontSize: 24,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Start now',
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: Colors.black,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.add_task_rounded,
              color: Colors.white.withOpacity(0.9),
              size: 72,
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Productivity Graph (fl_chart)
// ══════════════════════════════════════════════════════════════════════════
class _ProductivityGraphCard extends StatelessWidget {
  const _ProductivityGraphCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF262628),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Weekly Productivity Trend',
            style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 22,
                      getTitlesWidget: (value, meta) {
                        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                        if (value.toInt() >= 0 && value.toInt() < days.length) {
                          return Text(
                            days[value.toInt()],
                            style: const TextStyle(color: Colors.white54, fontSize: 12),
                          );
                        }
                        return const Text('');
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: const [
                      FlSpot(0, 70),
                      FlSpot(1, 85),
                      FlSpot(2, 60),
                      FlSpot(3, 90),
                      FlSpot(4, 95),
                    ],
                    isCurved: true,
                    color: const Color(0xFFFF735D), // Coral
                    barWidth: 4,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: const Color(0xFFFF735D).withOpacity(0.2),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Time Distribution Pie Chart (fl_chart)
// ══════════════════════════════════════════════════════════════════════════
class _TimeDistributionPieCard extends StatelessWidget {
  const _TimeDistributionPieCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF262628),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 1,
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 30,
                sections: [
                  PieChartSectionData(
                    color: const Color(0xFF5C7862), // Sage Green
                    value: 40,
                    title: '40%',
                    radius: 40,
                    titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  PieChartSectionData(
                    color: const Color(0xFFFF735D), // Coral
                    value: 30,
                    title: '30%',
                    radius: 35,
                    titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  PieChartSectionData(
                    color: Colors.blueAccent,
                    value: 30,
                    title: '30%',
                    radius: 35,
                    titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Legend
          Expanded(
            flex: 1,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _LegendItem(color: const Color(0xFF5C7862), text: 'Production'),
                const SizedBox(height: 8),
                _LegendItem(color: const Color(0xFFFF735D), text: 'Maintenance'),
                const SizedBox(height: 8),
                _LegendItem(color: Colors.blueAccent, text: 'Admin'),
              ],
            ),
          )
        ],
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  const _LegendItem({required this.color, required this.text});
  final Color color;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
        const SizedBox(width: 8),
        Text(text, style: const TextStyle(color: Colors.white70, fontSize: 13)),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Mocked Activity List
// ══════════════════════════════════════════════════════════════════════════
class _ActivityList extends ConsumerWidget {
  const _ActivityList();

  IconData _getIconForActivity(String title) {
    final lowercaseTitle = title.toLowerCase();
    if (lowercaseTitle.contains('assembly') || lowercaseTitle.contains('harness')) {
      return Icons.precision_manufacturing;
    } else if (lowercaseTitle.contains('inspect') || lowercaseTitle.contains('check') || lowercaseTitle.contains('quality')) {
      return Icons.fact_check;
    } else if (lowercaseTitle.contains('maintenance') || lowercaseTitle.contains('cleanup') || lowercaseTitle.contains('calibration')) {
      return Icons.build;
    } else if (lowercaseTitle.contains('prep') || lowercaseTitle.contains('sanding') || lowercaseTitle.contains('paint')) {
      return Icons.brush;
    }
    return Icons.assignment_outlined;
  }

  Color _getStatusColor(ActivityStatus status) {
    switch (status) {
      case ActivityStatus.completed:
        return const Color(0xFF5C7862); // Sage green
      case ActivityStatus.ongoing:
        return const Color(0xFFFF735D); // Coral
      case ActivityStatus.pending:
        return Colors.blueGrey;
    }
  }

  String _getStatusText(ActivityStatus status) {
    switch (status) {
      case ActivityStatus.completed:
        return 'Completed';
      case ActivityStatus.ongoing:
        return 'Ongoing';
      case ActivityStatus.pending:
        return 'Pending';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activities = ref.watch(activityHistoryProvider);

    if (activities.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF262628),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Center(
          child: Text(
            'No activities logged yet.',
            style: TextStyle(color: Colors.white54),
          ),
        ),
      );
    }

    // Take only the first 5 activities to show on dashboard
    final recentActivities = activities.take(5).toList();

    return Column(
      children: recentActivities.map((act) {
        final statusColor = _getStatusColor(act.status);
        final statusText = _getStatusText(act.status);
        final icon = _getIconForActivity(act.title);

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF262628),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  color: statusColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      act.title,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      act.timeString,
                      style: const TextStyle(color: Colors.white54, fontSize: 13),
                    ),
                  ],
                ),
              ),
              Text(
                statusText,
                style: TextStyle(
                  color: statusColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
