import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../daily_report/data/mock_data.dart';
import '../../daily_report/domain/daily_report_notifier.dart';
import '../domain/history_provider.dart';

/// Screen for viewing previously submitted activity reports.
///
/// Features:
/// - Reactive reports list using [historyProvider]
/// - Dynamic sorting (newest first)
/// - Custom status chips with precise color coding
/// - Factory-oriented professional layout with compact cards
/// - Empty state UI for empty history list
class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  // ──────────────────────────────────────────────────────────────────────
  // Color & UI helpers
  // ──────────────────────────────────────────────────────────────────────

  static Color _statusTextColor(String status) {
    switch (status) {
      case 'Approved':
        return const Color(0xFF2E7D32); // dark green
      case 'Rework Assigned':
        return const Color(0xFFC62828); // bold red
      case 'Pending':
      default:
        return const Color(0xFFE65100); // dark amber/orange
    }
  }

  static Color _statusBgColor(String status) {
    switch (status) {
      case 'Approved':
        return const Color(0xFFE8F5E9); // light green
      case 'Rework Assigned':
        return const Color(0xFFFFEBEE); // light red
      case 'Pending':
      default:
        return const Color(0xFFFFF3E0); // light amber
    }
  }

  static Color _productivityColor(double percent) {
    if (percent >= 90) return const Color(0xFF2E7D32);
    if (percent >= 70) return const Color(0xFFF57F17);
    return const Color(0xFFC62828);
  }

  String _formatDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  // ──────────────────────────────────────────────────────────────────────
  // Build
  // ──────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(historyProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity History'),
      ),
      body: historyAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.cloud_off_outlined,
                  size: 64,
                  color: theme.colorScheme.error.withValues(alpha: 0.5),
                ),
                const SizedBox(height: 16),
                Text(
                  'Could not load history.',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                TextButton.icon(
                  onPressed: () => ref.invalidate(historyProvider),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
        data: (reports) => reports.isEmpty
            ? _buildEmptyState(theme)
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                itemCount: reports.length,
                itemBuilder: (context, index) {
                  final report = reports[index];
                  return _buildReportCard(context, ref, report, theme);
                },
              ),
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // Private Sub-widgets
  // ──────────────────────────────────────────────────────────────────────

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.history_outlined,
              size: 72,
              color: theme.colorScheme.primary.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 24),
            Text(
              'No activity reports submitted yet.',
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReportCard(BuildContext context, WidgetRef ref, SubmittedReport report, ThemeData theme) {
    final statusColor = _statusTextColor(report.status);
    final statusBg = _statusBgColor(report.status);
    final prodColor = _productivityColor(report.productivityPercent);
    final isRework = report.status == 'Rework Assigned';

    final cardChild = Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isRework ? const Color(0xFFC62828).withValues(alpha: 0.4) : Colors.grey.shade200,
          width: isRework ? 1.2 : 1.0,
        ),
      ),
      elevation: 0,
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(14.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Top Row: Sales Order & Status Chip ─────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.receipt_long_outlined,
                      size: 18,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      report.salesOrder,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    report.status,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // ── Department Label ───────────────────────────────────────
            Text(
              report.department.toUpperCase(),
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.primary.withValues(alpha: 0.7),
                fontWeight: FontWeight.bold,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 2),

            // ── Activity Description ────────────────────────────────────
            Text(
              report.activity,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 12),

            Divider(height: 1, color: Colors.grey.shade200),
            const SizedBox(height: 12),

            // ── Bottom Metrics row ──────────────────────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Date & Time Column
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.calendar_today_outlined, size: 13, color: Colors.grey.shade600),
                        const SizedBox(width: 4),
                        Text(
                          _formatDate(report.submittedDate),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.grey.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    if (report.startTime.isNotEmpty && report.endTime.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.schedule, size: 13, color: Colors.grey.shade500),
                          const SizedBox(width: 4),
                          Text(
                            '${report.startTime} – ${report.endTime}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.grey.shade600,
                              fontSize: 10.5,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),

                // Duration Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.timer_outlined, size: 13, color: Colors.grey.shade700),
                      const SizedBox(width: 4),
                      Text(
                        '${report.durationMinutes} min',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade800,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),

                // Productivity Metric
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${report.productivityPercent.toStringAsFixed(1)}%',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: prodColor,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      'Productivity',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: Colors.grey.shade500,
                        fontSize: 9.5,
                      ),
                    ),
                  ],
                ),
              ],
            ),

            // ── Rework Actionable Visual Hint ───────────────────────────
            if (isRework) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEBEE), // light red
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFC62828).withValues(alpha: 0.2)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.edit_note, size: 18, color: Color(0xFFC62828)),
                    SizedBox(width: 6),
                    Text(
                      'Tap to edit and resubmit',
                      style: TextStyle(
                        color: Color(0xFFC62828),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );

    if (isRework) {
      return GestureDetector(
        onTap: () {
          // 1. Load the report data back into the Riverpod state notifier
          ref.read(dailyReportProvider.notifier).loadReportForRework(report);
          // 2. Navigate seamlessly back to the Daily Log tab via GoRouter
          context.go('/report');
        },
        child: cardChild,
      );
    }

    return cardChild;
  }
}
