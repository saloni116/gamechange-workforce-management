import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/daily_report/domain/logged_activity.dart';
import '../../features/daily_report/domain/activity_history_provider.dart';

/// Screen for viewing submitted and scheduled activity history.
/// Contains filters for All, Completed, Ongoing, and Pending tasks.
class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  String _selectedFilter = 'All';
  // Keep track of which activity IDs are expanded
  final Set<String> _expandedIds = {};

  final List<String> _filters = ['All', 'Completed', 'Ongoing', 'Pending'];

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

  IconData _getStatusIcon(ActivityStatus status) {
    switch (status) {
      case ActivityStatus.completed:
        return Icons.check_circle_outlined;
      case ActivityStatus.ongoing:
        return Icons.play_circle_outline_rounded;
      case ActivityStatus.pending:
        return Icons.schedule_outlined;
    }
  }

  Color _getProductivityColor(double percent) {
    if (percent >= 90) return const Color(0xFF2E7D32); // green
    if (percent >= 70) return const Color(0xFFF57F17); // amber
    return const Color(0xFFC62828); // red
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final allActivities = ref.watch(activityHistoryProvider);

    // Apply filtering logic
    final filteredActivities = allActivities.where((act) {
      if (_selectedFilter == 'All') return true;
      if (_selectedFilter == 'Completed' && act.status == ActivityStatus.completed) return true;
      if (_selectedFilter == 'Ongoing' && act.status == ActivityStatus.ongoing) return true;
      if (_selectedFilter == 'Pending' && act.status == ActivityStatus.pending) return true;
      return false;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity History'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ─── Filter Section ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _filters.map((filter) {
                    final isSelected = _selectedFilter == filter;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        label: Text(
                          filter,
                          style: TextStyle(
                            color: isSelected ? Colors.black : Colors.white70,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _selectedFilter = filter;
                            });
                          }
                        },
                        selectedColor: theme.colorScheme.primary,
                        backgroundColor: const Color(0xFF262628),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        showCheckmark: false,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // ─── Activity List Section ───────────────────────────────────────
            Expanded(
              child: filteredActivities.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.history_toggle_off_rounded,
                            size: 72,
                            color: Colors.grey.shade700,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No activities found',
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: Colors.grey.shade500,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Try changing the status filter above.',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                      itemCount: filteredActivities.length,
                      itemBuilder: (context, index) {
                        final act = filteredActivities[index];
                        final isExpanded = _expandedIds.contains(act.id);
                        final statusColor = _getStatusColor(act.status);
                        final statusText = _getStatusText(act.status);
                        final statusIcon = _getStatusIcon(act.status);
                        final icon = _getIconForActivity(act.title);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF262628),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: InkWell(
                            onTap: () => _toggleExpanded(act.id),
                            borderRadius: BorderRadius.circular(16),
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
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: statusColor.withOpacity(0.15),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          icon,
                                          color: statusColor,
                                          size: 24,
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              act.title,
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 16,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              act.departmentName,
                                              style: TextStyle(
                                                color: theme.colorScheme.primary.withOpacity(0.8),
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
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: statusColor.withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(20),
                                          border: Border.all(color: statusColor.withOpacity(0.3), width: 1),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              statusIcon,
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
                                  const SizedBox(height: 12),
                                  // --- Middle Row: Time Info + Expand Arrow ---
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.access_time_filled_rounded,
                                            size: 14,
                                            color: Colors.grey.shade500,
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            act.timeString,
                                            style: TextStyle(
                                              color: Colors.grey.shade400,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ],
                                      ),
                                      Icon(
                                        isExpanded
                                            ? Icons.keyboard_arrow_up_rounded
                                            : Icons.keyboard_arrow_down_rounded,
                                        color: Colors.grey.shade500,
                                      ),
                                    ],
                                  ),
                                  // --- Expandable Details Container ---
                                  AnimatedSize(
                                    duration: const Duration(milliseconds: 200),
                                    curve: Curves.easeInOut,
                                    child: isExpanded
                                        ? Container(
                                            margin: const EdgeInsets.only(top: 16),
                                            padding: const EdgeInsets.only(top: 16),
                                            decoration: BoxDecoration(
                                              border: Border(
                                                top: BorderSide(color: Colors.grey.shade800, width: 1),
                                              ),
                                            ),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                // If Sales Order exists
                                                if (act.salesOrderId != null) ...[
                                                  _buildDetailRow(
                                                    context,
                                                    'Sales Order ID',
                                                    act.salesOrderId!,
                                                    Icons.receipt_long_outlined,
                                                  ),
                                                  const SizedBox(height: 10),
                                                ],
                                                // Activity Code
                                                _buildDetailRow(
                                                  context,
                                                  'Activity Code',
                                                  act.activityCode,
                                                  Icons.tag_rounded,
                                                ),
                                                const SizedBox(height: 10),
                                                // Coworker
                                                if (act.hasCoworker && act.coworkerName != null) ...[
                                                  _buildDetailRow(
                                                    context,
                                                    'Coworker Support',
                                                    act.coworkerName!,
                                                    Icons.group_outlined,
                                                  ),
                                                  const SizedBox(height: 10),
                                                ],
                                                // Warn for Outside assigned role / Reason
                                                if (act.isOtherActivity && act.otherActivityReason != null) ...[
                                                  _buildWarningBlock(
                                                    context,
                                                    act.otherActivityReason!,
                                                  ),
                                                  const SizedBox(height: 12),
                                                ],
                                                // If completed, show duration and productivity
                                                if (act.status == ActivityStatus.completed) ...[
                                                  const SizedBox(height: 6),
                                                  Row(
                                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                    children: [
                                                      Text(
                                                        'Duration: ${act.durationMinutes} min',
                                                        style: const TextStyle(
                                                          color: Colors.white70,
                                                          fontSize: 13,
                                                        ),
                                                      ),
                                                      Text(
                                                        'Productivity: ${act.productivityPercent.toStringAsFixed(1)}%',
                                                        style: TextStyle(
                                                          color: _getProductivityColor(act.productivityPercent),
                                                          fontWeight: FontWeight.bold,
                                                          fontSize: 13,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                  const SizedBox(height: 8),
                                                  ClipRRect(
                                                    borderRadius: BorderRadius.circular(4),
                                                    child: LinearProgressIndicator(
                                                      value: (act.productivityPercent / 100).clamp(0.0, 1.0),
                                                      minHeight: 6,
                                                      backgroundColor: Colors.grey.shade800,
                                                      valueColor: AlwaysStoppedAnimation<Color>(
                                                        _getProductivityColor(act.productivityPercent),
                                                      ),
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
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey.shade500),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
        ),
        Text(
          value,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
        ),
      ],
    );
  }

  Widget _buildWarningBlock(BuildContext context, String reason) {
    const warningColor = Color(0xFFFF735D);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: warningColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: warningColor.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: warningColor, size: 16),
              SizedBox(width: 6),
              Text(
                'Outside assigned role',
                style: TextStyle(
                  color: warningColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            reason,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
