import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../features/auth/domain/auth_notifier.dart';
import '../../core/theme/app_theme.dart';

/// Screen for viewing the worker's profile.
/// Features team branding image hero, personal info, and activity stats.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
      backgroundColor: AppTheme.scaffoldBg,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ─── Hero Section with Team Image ─────────────────────────────
              _ProfileHeroSection(
                fullName: fullName,
                role: role,
                employeeId: employeeId,
              ),

              Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ─── Personal Information ───────────────────────────────
                    _SectionHeader(title: 'Personal Information', icon: Icons.person_outline_rounded),
                    const SizedBox(height: 12),
                    _InfoCard(children: [
                      _InfoRow(label: 'Employee ID', value: employeeId, icon: Icons.badge_outlined),
                      _InfoDivider(),
                      _InfoRow(label: 'Date of Birth', value: dob, icon: Icons.cake_outlined),
                      _InfoDivider(),
                      _InfoRow(label: 'Department', value: 'Assembly & Testing', icon: Icons.business_outlined),
                    ]),
                    const SizedBox(height: 28),

                    // ─── Daily Activity Statistics ──────────────────────────
                    _SectionHeader(title: "Today's Activity Summary", icon: Icons.today_rounded),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _StatCard(
                            label: 'Hours Worked',
                            value: '$hoursWorkedToday',
                            unit: '/ 8 hrs',
                            icon: Icons.timer_outlined,
                            color: AppTheme.industrialBlue,
                            progress: hoursWorkedToday / 8,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: _StatCard(
                            label: 'Activities Done',
                            value: '$activitiesDoneToday',
                            unit: 'performed',
                            icon: Icons.done_all_rounded,
                            color: AppTheme.emeraldGreen,
                            progress: activitiesDoneToday / 8.0,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ─── Weekly Hours Graph ─────────────────────────────────
                    _SectionHeader(title: 'Hours Logged This Week', icon: Icons.bar_chart_rounded),
                    const SizedBox(height: 12),
                    _WeeklyHoursCard(hoursWorkedToday: hoursWorkedToday),
                    const SizedBox(height: 28),

                    // ─── Sign Out ───────────────────────────────────────────
                    SizedBox(
                      height: 52,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          ref.read(authProvider.notifier).logout();
                        },
                        icon: const Icon(Icons.logout_rounded, size: 18),
                        label: Text(
                          'Sign Out',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.errorRed,
                          side: BorderSide(color: AppTheme.errorRed.withOpacity(0.5), width: 1.5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Profile Hero Section (Team Image + Name/Role Overlay)
// ══════════════════════════════════════════════════════════════════════════
class _ProfileHeroSection extends StatefulWidget {
  const _ProfileHeroSection({
    required this.fullName,
    required this.role,
    required this.employeeId,
  });

  final String fullName;
  final String role;
  final String employeeId;

  @override
  State<_ProfileHeroSection> createState() => _ProfileHeroSectionState();
}

class _ProfileHeroSectionState extends State<_ProfileHeroSection>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnim = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnim,
      child: Container(
        // Clean white/scaffold card — no blue gradient
        color: AppTheme.scaffoldBg,
        padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
        child: Stack(
          children: [
            // Centered avatar + info column
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Avatar circle — centred on screen
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppTheme.industrialBlue.withOpacity(0.4),
                        width: 3,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.industrialBlue.withOpacity(0.12),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: CircleAvatar(
                      radius: 44,
                      backgroundColor: AppTheme.surfaceGrey,
                      backgroundImage: const NetworkImage(
                          'https://i.pravatar.cc/150?img=11'),
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Full name
                  Text(
                    widget.fullName,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Role badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppTheme.tealAccent,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      widget.role,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Employee ID
                  Text(
                    widget.employeeId,
                    style: GoogleFonts.inter(
                      color: AppTheme.textSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            // Edit button stays top-right
            Positioned(
              top: 0,
              right: 0,
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.surfaceGrey,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: AppTheme.industrialBlue.withOpacity(0.15)),
                ),
                child: IconButton(
                  icon: Icon(Icons.edit_outlined,
                      color: AppTheme.industrialBlue, size: 20),
                  onPressed: () {},
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Section Header
// ══════════════════════════════════════════════════════════════════════════
class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.icon});
  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.industrialBlue),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
            letterSpacing: -0.2,
          ),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Info Card
// ══════════════════════════════════════════════════════════════════════════
class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 4),
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
      child: Column(children: children),
    );
  }
}

class _InfoDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, thickness: 1, color: AppTheme.borderColor);
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Info Row
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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppTheme.industrialBlue.withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: AppTheme.industrialBlue, size: 18),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  color: AppTheme.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: GoogleFonts.inter(
                  color: AppTheme.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Stat Card
// ══════════════════════════════════════════════════════════════════════════
class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.unit,
    required this.icon,
    required this.color,
    required this.progress,
  });

  final String label;
  final String value;
  final String unit;
  final IconData icon;
  final Color color;
  final double progress;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
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
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: GoogleFonts.inter(
              color: AppTheme.textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                value,
                style: GoogleFonts.inter(
                  color: AppTheme.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 22,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(width: 4),
              Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Text(
                  unit,
                  style: GoogleFonts.inter(
                    color: AppTheme.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              minHeight: 4,
              backgroundColor: AppTheme.borderColor,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Weekly Hours Bar Chart Card
// ══════════════════════════════════════════════════════════════════════════
class _WeeklyHoursCard extends StatelessWidget {
  const _WeeklyHoursCard({required this.hoursWorkedToday});
  final double hoursWorkedToday;

  BarChartGroupData _makeBarGroup(int x, double y, Color barColor) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: barColor,
          width: 16,
          borderRadius: const BorderRadius.all(Radius.circular(6)),
          backDrawRodData: BackgroundBarChartRodData(
            show: true,
            toY: 10,
            color: AppTheme.borderColor,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 220,
      padding: const EdgeInsets.all(16),
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
                        style: GoogleFonts.inter(
                          color: AppTheme.textSecondary,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
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
                reservedSize: 30,
                getTitlesWidget: (value, meta) {
                  if (value % 2 == 0) {
                    return Text(
                      '${value.toInt()}h',
                      style: GoogleFonts.inter(
                        color: AppTheme.textSecondary,
                        fontSize: 10,
                      ),
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
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: 2,
            getDrawingHorizontalLine: (value) => FlLine(
              color: AppTheme.borderColor,
              strokeWidth: 1,
            ),
          ),
          barGroups: [
            _makeBarGroup(0, 8.0, AppTheme.industrialBlue),
            _makeBarGroup(1, 7.5, AppTheme.industrialBlue),
            _makeBarGroup(2, 8.5, AppTheme.industrialBlue),
            _makeBarGroup(3, 6.0, AppTheme.industrialBlue),
            _makeBarGroup(4, hoursWorkedToday, AppTheme.tealAccent), // Today highlighted in teal
            _makeBarGroup(5, 0.0, AppTheme.borderColor),
            _makeBarGroup(6, 0.0, AppTheme.borderColor),
          ],
        ),
      ),
    );
  }
}
