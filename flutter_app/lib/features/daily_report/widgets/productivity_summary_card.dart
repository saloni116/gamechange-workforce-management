import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../domain/daily_report_notifier.dart';
import '../../../core/theme/app_theme.dart';

/// Displays a reactive productivity summary derived entirely from
/// [DailyReportState] getters.
///
/// **Visibility rule**: Only renders content when an activity is selected
/// AND `durationMinutes > 0`. Otherwise returns an empty [SizedBox].
///
/// **Color coding for productivity score**:
/// - Green  (≥ 90 %)
/// - Amber  (70 – 89 %)
/// - Red    (< 70 %)
///
/// No calculations are performed inside this widget — every displayed
/// value comes from a state getter.
class ProductivitySummaryCard extends ConsumerWidget {
  const ProductivitySummaryCard({super.key});

  // ──────────────────────────────────────────────────────────────────────
  // Color helpers
  // ──────────────────────────────────────────────────────────────────────

  static Color _scoreColor(double percent) {
    if (percent >= 90) return AppTheme.emeraldGreen;
    if (percent >= 70) return const Color(0xFFF59E0B); // amber
    return AppTheme.errorRed;
  }

  static Color _scoreBgColor(double percent) {
    if (percent >= 90) return AppTheme.emeraldGreen.withOpacity(0.1);
    if (percent >= 70) return const Color(0xFFF59E0B).withOpacity(0.1);
    return AppTheme.errorRed.withOpacity(0.1);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Build
  // ──────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(dailyReportProvider);
    final theme = Theme.of(context);

    // Visibility gate: only show when there's meaningful data.
    if (state.selectedActivity == null || state.durationMinutes <= 0) {
      return const SizedBox.shrink();
    }

    final productivity = state.productivityPercent;
    final color = _scoreColor(productivity);
    final bgColor = _scoreBgColor(productivity);
    // Clamp progress bar to 0..1 range.
    final progressValue = (productivity / 100).clamp(0.0, 1.0);

    return Container(
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
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ──────────────────────────────────────────────────
            Row(
              children: [
                const Icon(Icons.trending_up_rounded, size: 16, color: AppTheme.industrialBlue),
                const SizedBox(width: 8),
                Text(
                  'Productivity Summary',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                    letterSpacing: -0.2,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Metric row ──────────────────────────────────────────────
            Row(
              children: [
                _MetricTile(
                  label: 'Duration',
                  value: '${state.durationMinutes} min',
                  icon: Icons.timer_outlined,
                ),
                const SizedBox(width: 12),
                _MetricTile(
                  label: 'Actual Man-Min',
                  value: '${state.actualManMinutes}',
                  icon: Icons.group_outlined,
                ),
                const SizedBox(width: 12),
                _MetricTile(
                  label: 'Standard Min',
                  value: state.selectedActivity!.standardManMinutes.toStringAsFixed(0),
                  icon: Icons.straighten_outlined,
                ),
              ],
            ),

            const SizedBox(height: 20),

            // ── Large productivity score ────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  Text(
                    '${productivity.toStringAsFixed(1)}%',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: color,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Productivity',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: color.withValues(alpha: 0.8),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // ── Progress bar ────────────────────────────────────────────
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: progressValue,
                minHeight: 6,
                backgroundColor: AppTheme.borderColor,
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Private helper widget
// ──────────────────────────────────────────────────────────────────────────

/// Small tile that displays a single metric with an icon, value, and label.
class _MetricTile extends StatelessWidget {
  const _MetricTile({
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

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: AppTheme.surfaceGrey,
          borderRadius: BorderRadius.circular(10),
          border: const Border.fromBorderSide(
            BorderSide(color: AppTheme.borderColor, width: 1),
          ),
        ),
        child: Column(
          children: [
            Icon(icon, size: 18, color: AppTheme.industrialBlue),
            const SizedBox(height: 4),
            Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w400,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
