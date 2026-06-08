import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../app/router.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/domain/auth_notifier.dart';
import '../../daily_report/domain/daily_report_notifier.dart';
import '../../daily_report/data/mock_data.dart';
import '../../history/domain/history_provider.dart';
import '../../notifications/domain/notifications_provider.dart';

/// The home screen dashboard for GameChange BOS workforce.
/// Displays company branding, daily activity stats, charts, and quick actions.
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final userName = (authState.firstName != null && authState.firstName!.isNotEmpty)
        ? authState.firstName!
        : (authState.employeeId ?? 'User');

    final historyAsync = ref.watch(historyProvider);

    return Scaffold(
      backgroundColor: AppTheme.scaffoldBg,
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

            return CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ─── Header ─────────────────────────────────────────────
                      _DashboardHeader(userName: userName),

                      // ─── Company Brand Banner ───────────────────────────────
                      _CompanyBrandBanner(),

                      const SizedBox(height: 20),

                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // ─── Quick Actions ──────────────────────────────────
                            _NewActivityActionCard(
                              onTap: () => context.push(AppRoutes.newActivity),
                            ),
                            const SizedBox(height: 28),

                            // ─── Statistics Header ──────────────────────────────
                            Row(
                              children: [
                                Container(
                                  width: 4,
                                  height: 20,
                                  decoration: BoxDecoration(
                                    color: AppTheme.industrialBlue,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Text(
                                  'Your Statistics',
                                  style: GoogleFonts.inter(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.textPrimary,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // ─── Stat Summary Cards Row ─────────────────────────
                            _StatSummaryRow(activities: userActivities),
                            const SizedBox(height: 16),

                            // ─── Productivity Graph ─────────────────────────────
                            _ProductivityGraphCard(activities: userActivities),
                            const SizedBox(height: 16),

                            // ─── Time Distribution Pie Chart ────────────────────
                            _TimeDistributionPieCard(activities: userActivities),
                            const SizedBox(height: 28),

                            // ─── Recent Activities Header ───────────────────────
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 4,
                                      height: 20,
                                      decoration: BoxDecoration(
                                        color: AppTheme.emeraldGreen,
                                        borderRadius: BorderRadius.circular(2),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      'Daily Activities Done',
                                      style: GoogleFonts.inter(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textPrimary,
                                        letterSpacing: -0.3,
                                      ),
                                    ),
                                  ],
                                ),
                                GestureDetector(
                                  onTap: () => context.push(AppRoutes.history),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: AppTheme.industrialBlue.withOpacity(0.08),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Row(
                                      children: [
                                        Text(
                                          'See all',
                                          style: GoogleFonts.inter(
                                            color: AppTheme.industrialBlue,
                                            fontWeight: FontWeight.w600,
                                            fontSize: 13,
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        const Icon(
                                          Icons.arrow_forward_ios_rounded,
                                          size: 12,
                                          color: AppTheme.industrialBlue,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // ─── Live Activity List ─────────────────────────────
                            _ActivityList(activities: todayActivities),
                            const SizedBox(height: 100),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
          loading: () => const Center(
            child: CircularProgressIndicator(
              color: AppTheme.industrialBlue,
              strokeWidth: 2.5,
            ),
          ),
          error: (err, stack) => Center(
            child: _ErrorState(message: 'Error loading dashboard: $err'),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Dashboard Header
// ══════════════════════════════════════════════════════════════════════════
class _DashboardHeader extends ConsumerWidget {
  const _DashboardHeader({required this.userName});
  final String userName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsState = ref.watch(notificationsProvider);
    final unreadCount = notificationsState.notifications.where((n) => !n.isRead).length;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 16, 20),
      decoration: const BoxDecoration(
        color: AppTheme.cardWhite,
        border: Border(bottom: BorderSide(color: AppTheme.borderColor, width: 1)),
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.industrialBlue.withOpacity(0.2),
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.industrialBlue.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: CircleAvatar(
              radius: 22,
              backgroundColor: AppTheme.surfaceGrey,
              backgroundImage: const NetworkImage('https://i.pravatar.cc/150?img=11'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome back,',
                  style: GoogleFonts.inter(
                    color: AppTheme.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  userName,
                  style: GoogleFonts.inter(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                    letterSpacing: -0.3,
                  ),
                ),
              ],
            ),
          ),
          // Notification icon
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceGrey,
                  borderRadius: BorderRadius.circular(12),
                  border: const Border.fromBorderSide(
                    BorderSide(color: AppTheme.borderColor, width: 1),
                  ),
                ),
                child: IconButton(
                  icon: const Icon(Icons.notifications_outlined, size: 20),
                  color: AppTheme.textPrimary,
                  onPressed: () => context.push(AppRoutes.notifications),
                  padding: EdgeInsets.zero,
                ),
              ),
              if (unreadCount > 0)
                Positioned(
                  right: -3,
                  top: -3,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppTheme.errorRed,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
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
          const SizedBox(width: 4),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Company Brand Banner (Inauguration / Team Image)
// ══════════════════════════════════════════════════════════════════════════
class _CompanyBrandBanner extends StatefulWidget {
  @override
  State<_CompanyBrandBanner> createState() => _CompanyBrandBannerState();
}

class _CompanyBrandBannerState extends State<_CompanyBrandBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  final List<String> _images = [
    'assets/images/facility_aerial.jpg',
    'assets/images/inauguration.jpg',
    'assets/images/factory_floor.jpg',
    'assets/images/mumbai_team.jpg',
    'assets/images/transformer_team.jpg',
  ];

  int _currentIndex = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeAnim = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0.0, 0.06),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));
    _ctrl.forward();

    // Start automatic slideshow every 4.5 seconds
    _timer = Timer.periodic(const Duration(milliseconds: 4500), (timer) {
      if (mounted) {
        setState(() {
          _currentIndex = (_currentIndex + 1) % _images.length;
        });
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Preload all images to prevent flickering on first rotation
    for (final image in _images) {
      precacheImage(AssetImage(image), context);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnim,
      child: SlideTransition(
        position: _slideAnim,
        child: Center(
          child: ConstrainedBox(
            // Cap width on large desktop screens
            constraints: const BoxConstraints(maxWidth: 960),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: AspectRatio(
                  // 16:6 ratio — wide enough to look like a proper banner
                  // and tall enough to actually see the images on all devices
                  aspectRatio: 16 / 6,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.18),
                          blurRadius: 18,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 900),
                      transitionBuilder: (Widget child, Animation<double> animation) {
                        return FadeTransition(opacity: animation, child: child);
                      },
                      child: Image.asset(
                        _images[_currentIndex],
                        key: ValueKey<int>(_currentIndex),
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: double.infinity,
                        alignment: Alignment.center,
                        errorBuilder: (ctx, err, _) {
                          return Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  AppTheme.industrialBlue,
                                  AppTheme.tealAccent,
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
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
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF1E3A8A), // Dark blue
                Color(0xFF2563EB), // Industrial blue
                Color(0xFF3B82F6), // Lighter blue
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppTheme.industrialBlue.withOpacity(0.35),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Quick Action',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: Colors.white70,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Ready to log\na new activity?',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          height: 1.2,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.add_rounded,
                              size: 16,
                              color: AppTheme.industrialBlue,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Start now',
                              style: GoogleFonts.inter(
                                color: AppTheme.industrialBlue,
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.add_task_rounded,
                    color: Colors.white,
                    size: 48,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Stat Summary Row (quick stats cards)
// ══════════════════════════════════════════════════════════════════════════
class _StatSummaryRow extends StatelessWidget {
  const _StatSummaryRow({required this.activities});
  final List<SubmittedReport> activities;

  @override
  Widget build(BuildContext context) {
    final realActivities = activities.where((a) => !a.reportId.startsWith('ACT-MOCK')).toList();
    final total = realActivities.length;
    final approved = realActivities.where((a) => a.status == 'Approved').length;
    final avgProductivity = realActivities.isEmpty
        ? 0.0
        : realActivities.map((a) => a.productivityPercent).reduce((a, b) => a + b) / realActivities.length;

    return Row(
      children: [
        Expanded(
          child: _MiniStatCard(
            label: 'Total Activities',
            value: '$total',
            icon: Icons.task_alt_rounded,
            color: AppTheme.industrialBlue,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _MiniStatCard(
            label: 'Approved',
            value: '$approved',
            icon: Icons.check_circle_outline_rounded,
            color: AppTheme.emeraldGreen,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _MiniStatCard(
            label: 'Avg. Productivity',
            value: '${avgProductivity.toStringAsFixed(0)}%',
            icon: Icons.trending_up_rounded,
            color: AppTheme.tealAccent,
          ),
        ),
      ],
    );
  }
}

class _MiniStatCard extends StatelessWidget {
  const _MiniStatCard({
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
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(14),
        border: const Border.fromBorderSide(
          BorderSide(color: AppTheme.borderColor, width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: AppTheme.textSecondary,
            ),
            maxLines: 2,
          ),
        ],
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
      final day = act.submittedDate.weekday - 1;
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
    final spots = _getSpots(activities);

    return Container(
      height: 200,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      decoration: BoxDecoration(
        color: AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(16),
        border: const Border.fromBorderSide(
          BorderSide(color: AppTheme.borderColor, width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.show_chart_rounded, size: 16, color: AppTheme.industrialBlue),
              const SizedBox(width: 6),
              Text(
                'Weekly Productivity Trend',
                style: GoogleFonts.inter(
                  color: AppTheme.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 25,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: AppTheme.borderColor,
                    strokeWidth: 1,
                  ),
                ),
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
                            style: GoogleFonts.inter(
                              color: AppTheme.textSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
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
                    color: AppTheme.industrialBlue,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 4,
                          color: AppTheme.cardWhite,
                          strokeWidth: 2.5,
                          strokeColor: AppTheme.industrialBlue,
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          AppTheme.industrialBlue.withOpacity(0.18),
                          AppTheme.industrialBlue.withOpacity(0.0),
                        ],
                      ),
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

  static const List<Color> _pieColors = [
    AppTheme.industrialBlue,
    AppTheme.tealAccent,
    AppTheme.emeraldGreen,
    Color(0xFFF59E0B), // Amber
    Color(0xFF8B5CF6), // Purple
    Color(0xFFF97316), // Orange
  ];

  List<PieChartSectionData> _getPieSections(List<SubmittedReport> list) {
    final realActivities = list.where((act) => !act.reportId.startsWith('ACT-MOCK')).toList();
    if (realActivities.isEmpty) {
      return [
        PieChartSectionData(
          color: AppTheme.industrialBlue,
          value: 40,
          title: '40%',
          radius: 42,
          titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        PieChartSectionData(
          color: AppTheme.tealAccent,
          value: 30,
          title: '30%',
          radius: 38,
          titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        PieChartSectionData(
          color: AppTheme.emeraldGreen,
          value: 30,
          title: '30%',
          radius: 38,
          titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
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
          color: AppTheme.industrialBlue,
          value: 100,
          title: '100%',
          radius: 42,
          titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
        )
      ];
    }

    int colorIdx = 0;
    return deptDurations.entries.map((entry) {
      final pct = (entry.value / totalDuration) * 100;
      final color = _pieColors[colorIdx % _pieColors.length];
      colorIdx++;
      return PieChartSectionData(
        color: color,
        value: pct,
        title: '${pct.toStringAsFixed(0)}%',
        radius: 38,
        titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
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
          _LegendItem(color: AppTheme.industrialBlue, text: 'Assembly'),
          const SizedBox(height: 8),
          _LegendItem(color: AppTheme.tealAccent, text: 'Welding'),
          const SizedBox(height: 8),
          _LegendItem(color: AppTheme.emeraldGreen, text: 'Quality Control'),
        ],
      );
    }

    final Map<String, double> deptDurations = {};
    for (final act in realActivities) {
      final dept = act.department.isEmpty ? 'Other' : act.department;
      deptDurations[dept] = (deptDurations[dept] ?? 0.0) + act.durationMinutes.toDouble();
    }

    int colorIdx = 0;
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: deptDurations.keys.map((dept) {
        final color = _pieColors[colorIdx % _pieColors.length];
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
    final sections = _getPieSections(activities);

    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(16),
        border: const Border.fromBorderSide(
          BorderSide(color: AppTheme.borderColor, width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.pie_chart_outline_rounded, size: 16, color: AppTheme.tealAccent),
              const SizedBox(width: 6),
              Text(
                'Time by Department',
                style: GoogleFonts.inter(
                  color: AppTheme.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Row(
              children: [
                Expanded(
                  flex: 1,
                  child: PieChart(
                    PieChartData(
                      sectionsSpace: 2,
                      centerSpaceRadius: 28,
                      sections: sections,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  flex: 1,
                  child: _buildLegend(activities),
                ),
              ],
            ),
          ),
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
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              color: AppTheme.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Activity List
// ══════════════════════════════════════════════════════════════════════════
class _ActivityList extends StatelessWidget {
  const _ActivityList({required this.activities});
  final List<SubmittedReport> activities;

  IconData _getIconForActivity(String title) {
    final lc = title.toLowerCase();
    if (lc.contains('assembly') || lc.contains('harness')) return Icons.precision_manufacturing_rounded;
    if (lc.contains('inspect') || lc.contains('check') || lc.contains('quality')) return Icons.fact_check_rounded;
    if (lc.contains('maintenance') || lc.contains('cleanup') || lc.contains('calibration')) return Icons.build_rounded;
    if (lc.contains('prep') || lc.contains('sanding') || lc.contains('paint')) return Icons.brush_rounded;
    return Icons.assignment_outlined;
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return AppTheme.emeraldGreen;
      case 'rework assigned':
        return AppTheme.coralOrange;
      case 'pending':
      default:
        return AppTheme.tealAccent;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'Approved':
        return Icons.check_circle_rounded;
      case 'Rework Assigned':
        return Icons.warning_amber_rounded;
      case 'Pending':
      default:
        return Icons.schedule_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final realActivities = activities.where((act) => !act.reportId.startsWith('ACT-MOCK')).toList();
    final listToDisplay = realActivities.isNotEmpty ? realActivities : activities;

    if (listToDisplay.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: AppTheme.cardWhite,
          borderRadius: BorderRadius.circular(16),
          border: const Border.fromBorderSide(
            BorderSide(color: AppTheme.borderColor, width: 1),
          ),
        ),
        child: Column(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppTheme.surfaceGrey,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.inbox_outlined,
                size: 32,
                color: AppTheme.textHint,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'No activities logged yet',
              style: GoogleFonts.inter(
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Tap "Start now" to log your first activity today',
              style: GoogleFonts.inter(
                color: AppTheme.textHint,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    final recentActivities = listToDisplay.take(5).toList();

    return Column(
      children: recentActivities.map((act) {
        final statusColor = _getStatusColor(act.status);
        final icon = _getIconForActivity(act.activity);

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: AppTheme.cardWhite,
            borderRadius: BorderRadius.circular(14),
            border: Border(
              left: BorderSide(color: statusColor, width: 4),
              top: const BorderSide(color: AppTheme.borderColor, width: 1),
              right: const BorderSide(color: AppTheme.borderColor, width: 1),
              bottom: const BorderSide(color: AppTheme.borderColor, width: 1),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: statusColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        act.activity,
                        style: GoogleFonts.inter(
                          color: AppTheme.textPrimary,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${act.startTime} – ${act.endTime} · ${act.durationMinutes}m',
                        style: GoogleFonts.inter(
                          color: AppTheme.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: statusColor.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(_getStatusIcon(act.status), color: statusColor, size: 12),
                      const SizedBox(width: 5),
                      Text(
                        act.status,
                        style: GoogleFonts.inter(
                          color: statusColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Error State
// ══════════════════════════════════════════════════════════════════════════
class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppTheme.errorRed.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.cloud_off_rounded,
              size: 32,
              color: AppTheme.errorRed,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: GoogleFonts.inter(
              color: AppTheme.textSecondary,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
