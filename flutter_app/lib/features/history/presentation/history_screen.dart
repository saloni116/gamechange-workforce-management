import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../daily_report/data/mock_data.dart';
import '../../daily_report/domain/daily_report_notifier.dart';

import '../domain/history_provider.dart';
import '../../../app/router.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/domain/auth_notifier.dart';

/// Screen for viewing previously submitted activity reports.
///
/// Features:
/// - Factory floor hero banner with company imagery
/// - Premium enterprise card styling with left-accent status stripe
/// - Dynamic status-based filtering
/// - Expandable detail cards
/// - Rework assignment flow
class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  String _selectedFilter = 'All';
  final Set<String> _expandedIds = {};

  final List<String> _filters = ['All', 'Approved', 'Pending', 'Rework Assigned'];

  void _toggleExpanded(String id) {
    setState(() {
      if (_expandedIds.contains(id)) {
        _expandedIds.remove(id);
      } else {
        _expandedIds.add(id);
      }
    });
  }

  IconData _getIconForActivity(String title) {
    final lowercaseTitle = title.toLowerCase();
    if (lowercaseTitle.contains('assembly') || lowercaseTitle.contains('harness')) {
      return Icons.precision_manufacturing_rounded;
    } else if (lowercaseTitle.contains('inspect') || lowercaseTitle.contains('check') || lowercaseTitle.contains('quality')) {
      return Icons.fact_check_rounded;
    } else if (lowercaseTitle.contains('maintenance') || lowercaseTitle.contains('cleanup') || lowercaseTitle.contains('calibration')) {
      return Icons.build_rounded;
    } else if (lowercaseTitle.contains('prep') || lowercaseTitle.contains('sanding') || lowercaseTitle.contains('paint')) {
      return Icons.brush_rounded;
    }
    return Icons.assignment_outlined;
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Approved':
        return AppTheme.emeraldGreen;
      case 'Rework Assigned':
        return AppTheme.coralOrange;
      case 'Pending':
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

  Color _getProductivityColor(double percent) {
    if (percent >= 90) return AppTheme.emeraldGreen;
    if (percent >= 70) return const Color(0xFFF59E0B); // Amber
    return AppTheme.errorRed;
  }

  String _formatDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(historyProvider);

    return Scaffold(
      backgroundColor: AppTheme.scaffoldBg,
      body: SafeArea(
        child: Column(
          children: [
            // ─── Header with AppBar styling ─────────────────────────────────
            _HistoryHeader(),

            // ─── Filter Section ─────────────────────────────────────────────
            Container(
              color: AppTheme.cardWhite,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Filter by status',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _filters.map((filter) {
                        final isSelected = _selectedFilter == filter;
                        Color chipColor;
                        switch (filter) {
                          case 'Approved':
                            chipColor = AppTheme.emeraldGreen;
                            break;
                          case 'Rework Assigned':
                            chipColor = AppTheme.coralOrange;
                            break;
                          case 'Pending':
                            chipColor = AppTheme.tealAccent;
                            break;
                          default:
                            chipColor = AppTheme.industrialBlue;
                        }

                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            child: FilterChip(
                              label: Text(
                                filter,
                                style: GoogleFonts.inter(
                                  color: isSelected ? Colors.white : AppTheme.textSecondary,
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                                  fontSize: 13,
                                ),
                              ),
                              selected: isSelected,
                              onSelected: (selected) {
                                if (selected) {
                                  setState(() => _selectedFilter = filter);
                                }
                              },
                              selectedColor: chipColor,
                              backgroundColor: AppTheme.surfaceGrey,
                              checkmarkColor: Colors.white,
                              showCheckmark: false,
                              side: BorderSide(
                                color: isSelected ? chipColor : AppTheme.borderColor,
                                width: 1,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, thickness: 1, color: AppTheme.borderColor),

            // ─── Content List ───────────────────────────────────────────────
            Expanded(
              child: historyAsync.when(
                loading: () => const Center(
                  child: CircularProgressIndicator(
                    color: AppTheme.industrialBlue,
                    strokeWidth: 2.5,
                  ),
                ),
                error: (err, _) => _buildErrorState(),
                data: (reports) {
                  final authState = ref.watch(authProvider);
                  final filteredReports = reports.where((report) {
                    if (report.workerEmployeeId != authState.employeeId) return false;
                    if (_selectedFilter == 'All') return true;
                    return report.status == _selectedFilter;
                  }).toList();

                  if (filteredReports.isEmpty) {
                    return _buildEmptyState();
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                    itemCount: filteredReports.length,
                    itemBuilder: (context, index) {
                      final report = filteredReports[index];
                      final isExpanded = _expandedIds.contains(report.reportId);
                      final statusColor = _getStatusColor(report.status);
                      final statusIcon = _getStatusIcon(report.status);
                      final icon = _getIconForActivity(report.activity);
                      final isRework = report.status == 'Rework Assigned';

                      final cardChild = _HistoryCard(
                        report: report,
                        isExpanded: isExpanded,
                        statusColor: statusColor,
                        statusIcon: statusIcon,
                        activityIcon: icon,
                        isRework: isRework,
                        onTap: isRework ? null : () => _toggleExpanded(report.reportId),
                        productivityColor: _getProductivityColor(report.productivityPercent),
                        formattedDate: _formatDate(report.submittedDate),
                        buildDetailRow: _buildDetailRow,
                        buildWarningBlock: _buildWarningBlock,
                      );

                      if (isRework) {
                        return GestureDetector(
                          onTap: () {
                            ref.read(dailyReportProvider.notifier).loadReportForRework(report);
                            context.go(AppRoutes.newActivity);
                          },
                          child: cardChild,
                        );
                      }

                      return cardChild;
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppTheme.surfaceGrey,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.history_toggle_off_rounded,
              size: 40,
              color: AppTheme.textHint,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'No activities found',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Try changing the status filter above.',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppTheme.textHint,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppTheme.errorRed.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.cloud_off_rounded,
                size: 36,
                color: AppTheme.errorRed,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Could not load history.',
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => ref.invalidate(historyProvider),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.industrialBlue,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, String label, String value, IconData icon) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: AppTheme.surfaceGrey,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(icon, size: 14, color: AppTheme.textSecondary),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  color: AppTheme.textHint,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                value,
                style: GoogleFonts.inter(
                  color: AppTheme.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWarningBlock(BuildContext context, String reason) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.coralOrange.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.coralOrange.withOpacity(0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: AppTheme.coralOrange, size: 16),
              const SizedBox(width: 6),
              Text(
                'Outside assigned role',
                style: GoogleFonts.inter(
                  color: AppTheme.coralOrange,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            reason,
            style: GoogleFonts.inter(
              color: AppTheme.textSecondary,
              fontSize: 12,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  History Header with Factory Floor Image
// ══════════════════════════════════════════════════════════════════════════
class _HistoryHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      // 16:5 — a comfortable wide banner that shows the full factory floor image
      aspectRatio: 16 / 5,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Factory floor image — full cover, centred, no distortion
          Image.asset(
            'assets/images/factory_floor.jpg',
            fit: BoxFit.cover,
            alignment: Alignment.center,
            width: double.infinity,
            height: double.infinity,
            errorBuilder: (ctx, err, _) {
              return Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF0F172A),
                      Color(0xFF1E3A8A),
                    ],
                  ),
                ),
              );
            },
          ),
          // Dark overlay at bottom so text stays readable
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Color(0xCC0F172A),
                ],
                stops: [0.4, 1.0],
              ),
            ),
          ),
          // Page title text
          Positioned(
            bottom: 16,
            left: 20,
            right: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Activity History',
                  style: GoogleFonts.inter(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Your submitted work reports',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.white70,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  History Card Widget
// ══════════════════════════════════════════════════════════════════════════
class _HistoryCard extends StatelessWidget {
  const _HistoryCard({
    required this.report,
    required this.isExpanded,
    required this.statusColor,
    required this.statusIcon,
    required this.activityIcon,
    required this.isRework,
    required this.onTap,
    required this.productivityColor,
    required this.formattedDate,
    required this.buildDetailRow,
    required this.buildWarningBlock,
  });

  final SubmittedReport report;
  final bool isExpanded;
  final Color statusColor;
  final IconData statusIcon;
  final IconData activityIcon;
  final bool isRework;
  final VoidCallback? onTap;
  final Color productivityColor;
  final String formattedDate;
  final Widget Function(BuildContext, String, String, IconData) buildDetailRow;
  final Widget Function(BuildContext, String) buildWarningBlock;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(14),
        border: Border(
          left: BorderSide(color: statusColor, width: 4),
          top: BorderSide(
            color: isRework ? AppTheme.coralOrange.withOpacity(0.3) : AppTheme.borderColor,
            width: 1,
          ),
          right: BorderSide(
            color: isRework ? AppTheme.coralOrange.withOpacity(0.3) : AppTheme.borderColor,
            width: 1,
          ),
          bottom: BorderSide(
            color: isRework ? AppTheme.coralOrange.withOpacity(0.3) : AppTheme.borderColor,
            width: 1,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: isRework ? null : onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // --- Top Row: Icon + Title & Department + Status Badge ---
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(activityIcon, color: statusColor, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          report.activity,
                          style: GoogleFonts.inter(
                            color: AppTheme.textPrimary,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          report.department,
                          style: GoogleFonts.inter(
                            color: AppTheme.industrialBlue,
                            fontWeight: FontWeight.w500,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Status Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: statusColor.withOpacity(0.3), width: 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(statusIcon, color: statusColor, size: 12),
                        const SizedBox(width: 5),
                        Text(
                          report.status,
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
              const SizedBox(height: 10),
              // --- Middle Row: Date/Time + Expand Arrow ---
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.access_time_rounded, size: 13, color: AppTheme.textHint),
                      const SizedBox(width: 5),
                      Text(
                        '$formattedDate  ·  ${report.startTime} – ${report.endTime}',
                        style: GoogleFonts.inter(
                          color: AppTheme.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  if (!isRework)
                    Icon(
                      isExpanded
                          ? Icons.keyboard_arrow_up_rounded
                          : Icons.keyboard_arrow_down_rounded,
                      color: AppTheme.textHint,
                      size: 20,
                    ),
                ],
              ),
              // --- Expandable Details ---
              AnimatedSize(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeInOut,
                child: (isExpanded || isRework)
                    ? Container(
                        margin: const EdgeInsets.only(top: 14),
                        padding: const EdgeInsets.only(top: 14),
                        decoration: const BoxDecoration(
                          border: Border(
                            top: BorderSide(color: AppTheme.borderColor, width: 1),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            buildDetailRow(
                              context, 'Sales Order ID', report.salesOrder, Icons.receipt_long_outlined,
                            ),
                            const SizedBox(height: 10),
                            buildDetailRow(
                              context, 'Activity ID', report.activityId, Icons.tag_rounded,
                            ),
                            if (report.coworkerName != null && report.coworkerName!.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              buildDetailRow(
                                context, 'Coworker Support', report.coworkerName!, Icons.group_outlined,
                              ),
                            ],
                            if (report.remarks != null && report.remarks!.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              buildDetailRow(
                                context, 'Remarks', report.remarks!, Icons.comment_outlined,
                              ),
                            ],
                            if (report.managerRemarks != null && report.managerRemarks!.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              buildDetailRow(
                                context, 'Manager Remarks', report.managerRemarks!, Icons.rate_review_outlined,
                              ),
                            ],
                            if (report.otherActivityReason != null && report.otherActivityReason!.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              buildWarningBlock(context, report.otherActivityReason!),
                            ],
                            const SizedBox(height: 10),
                            // Duration & Productivity
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Duration: ${report.durationMinutes} min',
                                  style: GoogleFonts.inter(
                                    color: AppTheme.textSecondary,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: productivityColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'Productivity: ${report.productivityPercent.toStringAsFixed(1)}%',
                                    style: GoogleFonts.inter(
                                      color: productivityColor,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: (report.productivityPercent / 100).clamp(0.0, 1.0),
                                minHeight: 5,
                                backgroundColor: AppTheme.borderColor,
                                valueColor: AlwaysStoppedAnimation<Color>(productivityColor),
                              ),
                            ),
                            // Rework action banner
                            if (isRework) ...[
                              const SizedBox(height: 14),
                              Container(
                                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
                                decoration: BoxDecoration(
                                  color: AppTheme.coralOrange.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: AppTheme.coralOrange.withOpacity(0.3)),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.edit_note_rounded, size: 18, color: AppTheme.coralOrange),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Tap anywhere on card to edit and resubmit',
                                      style: GoogleFonts.inter(
                                        color: AppTheme.coralOrange,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
