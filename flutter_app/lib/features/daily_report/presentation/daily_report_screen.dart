import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../data/mock_data.dart';
import '../domain/daily_report_notifier.dart';
import '../domain/daily_report_state.dart';
import '../widgets/coworker_section.dart';
import '../widgets/productivity_summary_card.dart';
import '../widgets/time_picker_row.dart';
import '../../../core/theme/app_theme.dart';

/// Main Daily Report form screen — GameChange BOS Enterprise Design.
class DailyReportScreen extends ConsumerWidget {
  const DailyReportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(dailyReportProvider);
    final notifier = ref.read(dailyReportProvider.notifier);


    // ── Snackbar on successful submit ──────────────────────────────────
    _listenForSubmitSuccess(context, ref);

    // ── Live lists from notifier ────────────────────────────────────────
    final allActivities = notifier.activities;
    final allDepartments = notifier.getDepartmentsForSalesOrder(state.selectedSO);
    final allSalesOrders = notifier.salesOrders;

    // ── Activities: filtered by department OR full list ─────────────────
    final List<Activity> displayedActivities;
    if (state.showAllActivities) {
      displayedActivities = allActivities.toList();
    } else if (state.selectedDepartment != null) {
      displayedActivities = allActivities
          .where((a) =>
              a.departmentId == state.selectedDepartment!.id &&
              a.isInRole == true &&
              (state.selectedSO == null ||
                  state.selectedSO!.activityIds.isEmpty ||
                  state.selectedSO!.activityIds.contains(a.id)))
          .toList();
    } else {
      displayedActivities = <Activity>[];
    }

    final bool endTimeBeforeStart = _isEndBeforeStart(state);

    return Scaffold(
      backgroundColor: AppTheme.scaffoldBg,
      appBar: AppBar(
        backgroundColor: AppTheme.cardWhite,
        elevation: 0,
        scrolledUnderElevation: 1,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          color: AppTheme.textPrimary,
          onPressed: () => context.pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Log New Activity',
              style: GoogleFonts.inter(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
                letterSpacing: -0.3,
              ),
            ),
            Text(
              'GameChange BOS Workforce',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w400,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
        actions: [
          if (state.isLoadingDropdowns)
            const Padding(
              padding: EdgeInsets.only(right: 16),
              child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppTheme.industrialBlue,
                ),
              ),
            ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ═══ Section: Activity Setup ════════════════════════════════
              _FormSectionHeader(
                title: 'Activity Setup',
                subtitle: 'Required *',
                icon: Icons.settings_rounded,
                iconColor: AppTheme.industrialBlue,
              ),
              const SizedBox(height: 14),

              // ═══ 1. Sales Order ═══════════════════════════════════════
              _SalesOrderDropdown(
                selectedSO: state.selectedSO,
                salesOrders: allSalesOrders,
                onChanged: notifier.selectSalesOrder,
              ),
              const SizedBox(height: 12),

              // ═══ 2. Department ════════════════════════════════════════
              _DepartmentDropdown(
                selectedDepartment: state.selectedDepartment,
                departments: allDepartments,
                enabled: state.selectedSO != null,
                onChanged: notifier.selectDepartment,
              ),
              const SizedBox(height: 12),

              // ═══ 3. Activity ═════════════════════════════════════════
              _ActivityDropdown(
                activities: displayedActivities,
                selectedActivity: state.selectedActivity,
                enabled: state.selectedDepartment != null,
                onChanged: notifier.selectActivity,
              ),
              const SizedBox(height: 4),

              // ═══ 3b. Show All Activities Toggle ══════════════════════
              if (state.selectedDepartment != null)
                Container(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.cardWhite,
                    borderRadius: BorderRadius.circular(12),
                    border: const Border.fromBorderSide(
                      BorderSide(color: AppTheme.borderColor, width: 1),
                    ),
                  ),
                  child: CheckboxListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                    dense: true,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    controlAffinity: ListTileControlAffinity.leading,
                    activeColor: AppTheme.industrialBlue,
                    title: Text(
                      'Show Other Activities',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    subtitle: state.showAllActivities
                        ? Text(
                            'Showing all activities across departments',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                          )
                        : null,
                    value: state.showAllActivities,
                    onChanged: (v) => notifier.toggleShowAllActivities(v ?? false),
                  ),
                ),

              // ═══ 3a. Other Activity Warning ══════════════════════════
              if (state.isOtherActivity) ...[
                const SizedBox(height: 8),
                _OtherActivityWarning(
                  reason: state.otherActivityReason,
                  onChanged: notifier.setOtherActivityReason,
                ),
              ],
              const SizedBox(height: 24),

              // ═══ Section: Time Entry ══════════════════════════════════
              _FormSectionHeader(
                title: 'Time Entry',
                icon: Icons.schedule_rounded,
                iconColor: AppTheme.tealAccent,
              ),
              const SizedBox(height: 14),

              // ═══ 4. Time Entry ════════════════════════════════════════
              _TimeEntrySection(
                startTime: state.startTime,
                endTime: state.endTime,
                endTimeBeforeStart: endTimeBeforeStart,
                onStartSelected: notifier.setStartTime,
                onEndSelected: notifier.setEndTime,
              ),
              const SizedBox(height: 24),

              // ═══ Section: Team ════════════════════════════════════════
              _FormSectionHeader(
                title: 'Team',
                icon: Icons.group_rounded,
                iconColor: AppTheme.emeraldGreen,
              ),
              const SizedBox(height: 14),

              // ═══ 5. Coworker ══════════════════════════════════════════
              const CoworkerSection(),
              const SizedBox(height: 24),

              // ═══ Section: Remarks ═════════════════════════════════════
              _FormSectionHeader(
                title: 'Remarks',
                icon: Icons.comment_outlined,
                iconColor: AppTheme.textSecondary,
              ),
              const SizedBox(height: 14),
              _RemarksSection(
                remarks: state.remarks,
                onChanged: notifier.setRemarks,
              ),
              const SizedBox(height: 24),

              // ═══ Section: Your Progress ═══════════════════════════════
              _FormSectionHeader(
                title: 'Your Progress',
                icon: Icons.trending_up_rounded,
                iconColor: AppTheme.industrialBlue,
              ),
              const SizedBox(height: 14),

              // ═══ 6. Productivity Summary ══════════════════════════════
              const ProductivitySummaryCard(),
              const SizedBox(height: 14),

              // ═══ Error banners ════════════════════════════════════════
              if (state.duplicateError != null)
                _ErrorBanner(
                  message: state.duplicateError!,
                  onDismiss: notifier.clearDuplicateError,
                ),
              if (state.submitErrorMessage != null)
                _ErrorBanner(
                  message: state.submitErrorMessage!,
                  onDismiss: notifier.clearSubmitError,
                ),
              const SizedBox(height: 16),

              // ═══ 7. Submit Button ═════════════════════════════════════
              SizedBox(
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: state.canSubmit
                      ? () async => await notifier.submit()
                      : null,
                  icon: state.isSubmitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send_rounded, size: 18),
                  label: Text(
                    state.isSubmitting ? 'Submitting...' : 'Submit Report',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.industrialBlue,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppTheme.industrialBlue.withOpacity(0.35),
                    disabledForegroundColor: Colors.white60,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────

  static bool _isEndBeforeStart(DailyReportState state) {
    if (state.startTime == null || state.endTime == null) return false;
    final s = state.startTime!.hour * 60 + state.startTime!.minute;
    final e = state.endTime!.hour * 60 + state.endTime!.minute;
    return e <= s;
  }

  void _listenForSubmitSuccess(BuildContext context, WidgetRef ref) {
    ref.listen(dailyReportProvider, (DailyReportState? prev, DailyReportState next) {
      if (next.submitSuccessMessage != null &&
          next.submitSuccessMessage != prev?.submitSuccessMessage) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Expanded(child: Text(next.submitSuccessMessage!)),
              ],
            ),
            backgroundColor: AppTheme.emeraldGreen,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            margin: const EdgeInsets.all(16),
            duration: const Duration(seconds: 3),
          ),
        );
        ref.read(dailyReportProvider.notifier).clearSubmitSuccess();

        // Return to Dashboard after a short delay
        Future.delayed(const Duration(seconds: 1), () {
          if (context.mounted) {
            context.pop();
          }
        });
      }
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Form Section Header
// ══════════════════════════════════════════════════════════════════════════
class _FormSectionHeader extends StatelessWidget {
  const _FormSectionHeader({
    required this.title,
    this.subtitle,
    required this.icon,
    required this.iconColor,
  });

  final String title;
  final String? subtitle;
  final IconData icon;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: iconColor),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
            letterSpacing: -0.2,
          ),
        ),
        if (subtitle != null) ...[
          const Spacer(),
          Text(
            subtitle!,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppTheme.textHint,
            ),
          ),
        ],
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Private section widgets
// ══════════════════════════════════════════════════════════════════════════

class _SalesOrderDropdown extends StatelessWidget {
  const _SalesOrderDropdown({
    required this.selectedSO,
    required this.salesOrders,
    required this.onChanged,
  });

  final SalesOrder? selectedSO;
  final List<SalesOrder> salesOrders;
  final ValueChanged<SalesOrder?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<SalesOrder>(
      key: ValueKey('${selectedSO?.id}_${salesOrders.length}'),
      initialValue: selectedSO,
      style: GoogleFonts.inter(
        color: AppTheme.textPrimary,
        fontSize: 15,
        fontWeight: FontWeight.w500,
      ),
      icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppTheme.textSecondary),
      decoration: const InputDecoration(
        labelText: 'Sales Order',
        prefixIcon: Icon(Icons.receipt_long_outlined),
      ),
      hint: Text(
        'Select sales order',
        style: GoogleFonts.inter(color: AppTheme.textHint, fontSize: 14),
      ),
      dropdownColor: AppTheme.cardWhite,
      items: salesOrders.map((so) {
        return DropdownMenuItem(
          value: so,
          child: Text(
            so.label,
            style: GoogleFonts.inter(
              color: AppTheme.textPrimary,
              fontSize: 14,
            ),
          ),
        );
      }).toList(),
      onChanged: onChanged,
    );
  }
}

class _DepartmentDropdown extends StatelessWidget {
  const _DepartmentDropdown({
    required this.selectedDepartment,
    required this.departments,
    required this.enabled,
    required this.onChanged,
  });

  final Department? selectedDepartment;
  final List<Department> departments;
  final bool enabled;
  final ValueChanged<Department?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<Department>(
      key: ValueKey('${selectedDepartment?.id}_${departments.length}'),
      initialValue: selectedDepartment,
      style: GoogleFonts.inter(
        color: AppTheme.textPrimary,
        fontSize: 15,
        fontWeight: FontWeight.w500,
      ),
      icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppTheme.textSecondary),
      decoration: InputDecoration(
        labelText: 'Department',
        prefixIcon: const Icon(Icons.business_outlined),
        hintText: enabled ? 'Select department' : 'Select a sales order first',
      ),
      hint: Text(
        enabled ? 'Select department' : 'Select a sales order first',
        style: GoogleFonts.inter(color: AppTheme.textHint, fontSize: 14),
      ),
      dropdownColor: AppTheme.cardWhite,
      items: departments.map((dept) {
        return DropdownMenuItem(
          value: dept,
          child: Text(
            dept.name,
            style: GoogleFonts.inter(color: AppTheme.textPrimary, fontSize: 14),
          ),
        );
      }).toList(),
      onChanged: enabled ? onChanged : null,
    );
  }
}

class _ActivityDropdown extends StatelessWidget {
  const _ActivityDropdown({
    required this.activities,
    required this.selectedActivity,
    required this.enabled,
    required this.onChanged,
  });

  final List<Activity> activities;
  final Activity? selectedActivity;
  final bool enabled;
  final ValueChanged<Activity?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<Activity>(
      key: ValueKey('${selectedActivity?.id}_${activities.length}'),
      initialValue: selectedActivity,
      style: GoogleFonts.inter(
        color: AppTheme.textPrimary,
        fontSize: 15,
        fontWeight: FontWeight.w500,
      ),
      icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppTheme.textSecondary),
      decoration: InputDecoration(
        labelText: 'Activity',
        prefixIcon: const Icon(Icons.task_alt_outlined),
        hintText: enabled ? 'Select activity' : 'Select a department first',
      ),
      dropdownColor: AppTheme.cardWhite,
      items: activities.map((act) {
        return DropdownMenuItem(
          value: act,
          child: Text(
            act.activityCode.isEmpty
                ? act.activityName
                : '${act.activityCode} — ${act.activityName}',
            style: GoogleFonts.inter(color: AppTheme.textPrimary, fontSize: 14),
            overflow: TextOverflow.ellipsis,
          ),
        );
      }).toList(),
      onChanged: enabled ? onChanged : null,
    );
  }
}

class _OtherActivityWarning extends StatefulWidget {
  const _OtherActivityWarning({
    required this.reason,
    required this.onChanged,
  });

  final String reason;
  final ValueChanged<String> onChanged;

  @override
  State<_OtherActivityWarning> createState() => _OtherActivityWarningState();
}

class _OtherActivityWarningState extends State<_OtherActivityWarning> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.reason);
  }

  @override
  void didUpdateWidget(covariant _OtherActivityWarning oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.reason != _controller.text) {
      _controller.text = widget.reason;
      _controller.selection = TextSelection.fromPosition(
        TextPosition(offset: _controller.text.length),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.coralOrange.withOpacity(0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.coralOrange.withOpacity(0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: AppTheme.coralOrange, size: 18),
              const SizedBox(width: 8),
              Text(
                'Outside assigned role',
                style: GoogleFonts.inter(
                  color: AppTheme.coralOrange,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppTheme.textPrimary,
            ),
            decoration: InputDecoration(
              labelText: 'Reason (required)',
              hintText: 'Why are you performing this?',
              fillColor: AppTheme.cardWhite,
              filled: true,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.borderColor),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.borderColor),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.coralOrange, width: 1.5),
              ),
            ),
            maxLines: 2,
            onChanged: widget.onChanged,
          ),
        ],
      ),
    );
  }
}

class _TimeEntrySection extends StatelessWidget {
  const _TimeEntrySection({
    required this.startTime,
    required this.endTime,
    required this.endTimeBeforeStart,
    required this.onStartSelected,
    required this.onEndSelected,
  });

  final TimeOfDay? startTime;
  final TimeOfDay? endTime;
  final bool endTimeBeforeStart;
  final ValueChanged<TimeOfDay> onStartSelected;
  final ValueChanged<TimeOfDay> onEndSelected;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.cardWhite,
              borderRadius: BorderRadius.circular(12),
              border: const Border.fromBorderSide(
                BorderSide(color: AppTheme.borderColor, width: 1.5),
              ),
            ),
            child: TimePickerRow(
              label: 'Start',
              selectedTime: startTime,
              onTimeSelected: onStartSelected,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.cardWhite,
              borderRadius: BorderRadius.circular(12),
              border: Border.fromBorderSide(
                BorderSide(
                  color: endTimeBeforeStart ? AppTheme.errorRed : AppTheme.borderColor,
                  width: endTimeBeforeStart ? 2 : 1.5,
                ),
              ),
            ),
            child: TimePickerRow(
              label: 'End',
              selectedTime: endTime,
              onTimeSelected: onEndSelected,
              errorText: endTimeBeforeStart ? 'Before start' : null,
            ),
          ),
        ),
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({
    required this.message,
    required this.onDismiss,
  });

  final String message;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.errorRed.withOpacity(0.06),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.errorRed.withOpacity(0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline_rounded, color: AppTheme.errorRed, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.inter(
                color: AppTheme.errorRed,
                fontWeight: FontWeight.w500,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onDismiss,
            child: const Icon(Icons.close_rounded, color: AppTheme.errorRed, size: 18),
          ),
        ],
      ),
    );
  }
}

class _RemarksSection extends StatefulWidget {
  const _RemarksSection({
    required this.remarks,
    required this.onChanged,
  });

  final String remarks;
  final ValueChanged<String> onChanged;

  @override
  State<_RemarksSection> createState() => _RemarksSectionState();
}

class _RemarksSectionState extends State<_RemarksSection> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.remarks);
  }

  @override
  void didUpdateWidget(covariant _RemarksSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.remarks != _controller.text) {
      _controller.text = widget.remarks;
      _controller.selection = TextSelection.fromPosition(
        TextPosition(offset: _controller.text.length),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      style: GoogleFonts.inter(
        fontSize: 14,
        color: AppTheme.textPrimary,
      ),
      decoration: const InputDecoration(
        labelText: 'Remarks (optional)',
        hintText: 'Enter any additional comments or remarks...',
        prefixIcon: Icon(Icons.comment_outlined),
      ),
      maxLines: 3,
      onChanged: widget.onChanged,
    );
  }
}
