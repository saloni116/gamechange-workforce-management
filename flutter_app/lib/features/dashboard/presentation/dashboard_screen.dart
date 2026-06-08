import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../auth/domain/auth_notifier.dart';
import '../../daily_report/domain/daily_report_notifier.dart';
import '../../daily_report/data/mock_data.dart';
import '../../history/domain/history_provider.dart';
import '../../notifications/domain/notifications_provider.dart';

/// The new home screen dashboard for the user.
/// Displays daily activity stats, charts, and a quick action button.
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final authState = ref.watch(authProvider);
    final userName = (authState.firstName != null && authState.firstName!.isNotEmpty)
        ? authState.firstName!
        : (authState.employeeId ?? 'User');

    final historyAsync = ref.watch(historyProvider);

    return Scaffold(
      body: SafeArea(
        child: historyAsync.when(
          data: (activities) {
            // Filter all statistics by logged-in user's employeeId
            final userActivities = activities.where((act) => act.workerEmployeeId == authState.employeeId).toList();

            // Filter daily list to only show today's activities in Indian Standard Time (IST)
            final nowUtc = DateTime.now().toUtc();
            final nowIst = nowUtc.add(const Duration(hours: 5, minutes: 30));
            final todayIst = DateTime(nowIst.year, nowIst.month, nowIst.day);

            final todayActivities = userActivities.where((act) =>
                act.submittedDate.year == todayIst.year &&
                act.submittedDate.month == todayIst.month &&
                act.submittedDate.day == todayIst.day).toList();

            return SingleChildScrollView(
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
                  _ProductivityGraphCard(activities: userActivities),
                  const SizedBox(height: 16),

                  // ─── Time Distribution Pie Chart ──────────────────────────────
                  _TimeDistributionPieCard(activities: userActivities),
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

                  // ─── Live Activity List ─────────────────────────────────────
                  _ActivityList(activities: todayActivities),
                ],
              ),
            );
          },
          loading: () => const Center(
            child: CircularProgressIndicator(),
          ),
          error: (err, stack) => Center(
            child: Text('Error loading dashboard: $err'),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Custom Header
// ══════════════════════════════════════════════════════════════════════════
class _CustomHeader extends ConsumerWidget {
  const _CustomHeader({required this.userName});
  final String userName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final notificationsState = ref.watch(notificationsProvider);
    final unreadCount = notificationsState.notifications.where((n) => !n.isRead).length;

    return Row(
      children: [
        CircleAvatar(
          radius: 24,
          backgroundColor: theme.brightness == Brightness.dark
              ? Colors.grey.shade800
              : Colors.grey.shade300,
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
                  color: theme.brightness == Brightness.dark
                      ? Colors.grey.shade400
                      : Colors.grey.shade600,
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
        Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_none),
              color: theme.colorScheme.onSurface,
              onPressed: () => context.push(AppRoutes.notifications),
            ),
            if (unreadCount > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Color(0xFFFF735D), // Coral
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    '$unreadCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
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
  const _ProductivityGraphCard({required this.activities});
  final List<SubmittedReport> activities;

  List<FlSpot> _getSpots(List<SubmittedReport> list) {
    final realActivities = list.where((act) => !act.reportId.startsWith('ACT-MOCK')).toList();
    if (realActivities.isEmpty) {
      return const [
        FlSpot(0, 70),
        FlSpot(1, 85),
        FlSpot(2, 60),
        FlSpot(3, 90),
        FlSpot(4, 95),
      ];
    }

    final dailyValues = List.generate(7, (_) => <double>[]);
    for (final act in realActivities) {
      final day = act.submittedDate.weekday - 1; // 0-6 (Mon-Sun)
      if (day >= 0 && day < 7) {
        dailyValues[day].add(act.productivityPercent);
      }
    }

    final List<FlSpot> spots = [];
    for (int i = 0; i < 7; i++) {
      if (dailyValues[i].isEmpty) {
        spots.add(FlSpot(i.toDouble(), 0));
      } else {
        final avg = dailyValues[i].reduce((a, b) => a + b) / dailyValues[i].length;
        spots.add(FlSpot(i.toDouble(), double.parse(avg.toStringAsFixed(1))));
      }
    }
    return spots;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final spots = _getSpots(activities);

    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardTheme.color ?? theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Weekly Productivity Trend',
            style: TextStyle(
              color: theme.colorScheme.onSurface.withOpacity(0.8),
              fontWeight: FontWeight.bold,
            ),
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
                            style: TextStyle(
                              color: theme.colorScheme.onSurface.withOpacity(0.6),
                              fontSize: 12,
                            ),
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
                    spots: spots,
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
  const _TimeDistributionPieCard({required this.activities});
  final List<SubmittedReport> activities;

  List<PieChartSectionData> _getPieSections(List<SubmittedReport> list) {
    final realActivities = list.where((act) => !act.reportId.startsWith('ACT-MOCK')).toList();
    if (realActivities.isEmpty) {
      return [
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
      ];
    }

    final Map<String, double> deptDurations = {};
    double totalDuration = 0;
    for (final act in realActivities) {
      final dept = act.department.isEmpty ? 'Other' : act.department;
      final duration = act.durationMinutes.toDouble();
      deptDurations[dept] = (deptDurations[dept] ?? 0.0) + duration;
      totalDuration += duration;
    }

    if (totalDuration == 0) {
      return [
        PieChartSectionData(
          color: const Color(0xFF5C7862),
          value: 100,
          title: '100%',
          radius: 40,
          titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
        )
      ];
    }

    final colors = [
      const Color(0xFF5C7862),
      const Color(0xFFFF735D),
      Colors.blueAccent,
      Colors.amber,
      Colors.purple,
      Colors.teal,
    ];

    int colorIdx = 0;
    return deptDurations.entries.map((entry) {
      final pct = (entry.value / totalDuration) * 100;
      final color = colors[colorIdx % colors.length];
      colorIdx++;
      return PieChartSectionData(
        color: color,
        value: pct,
        title: '${pct.toStringAsFixed(0)}%',
        radius: 35,
        titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
      );
    }).toList();
  }

  Widget _buildLegend(List<SubmittedReport> list) {
    final realActivities = list.where((act) => !act.reportId.startsWith('ACT-MOCK')).toList();
    if (realActivities.isEmpty) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _LegendItem(color: const Color(0xFF5C7862), text: 'Assembly'),
          const SizedBox(height: 8),
          _LegendItem(color: const Color(0xFFFF735D), text: 'Welding'),
          const SizedBox(height: 8),
          _LegendItem(color: Colors.blueAccent, text: 'Quality Control'),
        ],
      );
    }

    final Map<String, double> deptDurations = {};
    for (final act in realActivities) {
      final dept = act.department.isEmpty ? 'Other' : act.department;
      deptDurations[dept] = (deptDurations[dept] ?? 0.0) + act.durationMinutes.toDouble();
    }

    final colors = [
      const Color(0xFF5C7862),
      const Color(0xFFFF735D),
      Colors.blueAccent,
      Colors.amber,
      Colors.purple,
      Colors.teal,
    ];

    int colorIdx = 0;
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: deptDurations.keys.map((dept) {
        final color = colors[colorIdx % colors.length];
        colorIdx++;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: _LegendItem(color: color, text: dept),
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final sections = _getPieSections(activities);

    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardTheme.color ?? theme.colorScheme.surface,
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
                sections: sections,
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Legend
          Expanded(
            flex: 1,
            child: _buildLegend(activities),
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
    final theme = Theme.of(context);
    return Row(
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: theme.colorScheme.onSurface.withOpacity(0.8),
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Mocked / Live Activity List
// ══════════════════════════════════════════════════════════════════════════
class _ActivityList extends StatelessWidget {
  const _ActivityList({required this.activities});
  final List<SubmittedReport> activities;

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

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return const Color(0xFF5C7862); // Sage green
      case 'rework assigned':
        return const Color(0xFFFF735D); // Coral
      case 'pending':
      default:
        return Colors.blueGrey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'Approved':
        return Icons.check_circle_outlined;
      case 'Rework Assigned':
        return Icons.warning_amber_rounded;
      case 'Pending':
      default:
        return Icons.schedule_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    // Filter out mock activities if we have real logged ones
    final realActivities = activities.where((act) => !act.reportId.startsWith('ACT-MOCK')).toList();
    final listToDisplay = realActivities.isNotEmpty ? realActivities : activities;

    if (listToDisplay.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: theme.cardTheme.color ?? theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: Text(
            'No activities logged yet.',
            style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.54)),
          ),
        ),
      );
    }

    // Take only the first 5 activities to show on dashboard
    final recentActivities = listToDisplay.take(5).toList();

    return Column(
      children: recentActivities.map((act) {
        final statusColor = _getStatusColor(act.status);
        final statusText = act.status;
        final icon = _getIconForActivity(act.activity);

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.cardTheme.color ?? theme.colorScheme.surface,
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
                      act.activity,
                      style: TextStyle(
                        color: theme.colorScheme.onSurface,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${act.startTime} - ${act.endTime} (${act.durationMinutes}m)',
                      style: TextStyle(
                        color: theme.colorScheme.onSurface.withOpacity(0.54),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: statusColor.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _getStatusIcon(act.status),
                      color: statusColor,
                      size: 14,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      statusText,
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
