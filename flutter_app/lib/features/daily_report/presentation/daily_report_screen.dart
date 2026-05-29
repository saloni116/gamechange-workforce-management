import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/mock_data.dart';
import '../domain/daily_report_notifier.dart';
import '../domain/daily_report_state.dart';
import '../widgets/coworker_section.dart';
import '../widgets/productivity_summary_card.dart';
import '../widgets/time_picker_row.dart';

/// Main Daily Report form screen with Dark Premium Theme.
class DailyReportScreen extends ConsumerWidget {
  const DailyReportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(dailyReportProvider);
    final notifier = ref.read(dailyReportProvider.notifier);
    final theme = Theme.of(context);

    // ── Snackbar on successful submit ──────────────────────────────────
    _listenForSubmitSuccess(context, ref);

    // ── Activities filtered by selected department ─────────────────────
    final filteredActivities = state.selectedDepartment != null
        ? mockActivities
              .where((a) => a.departmentId == state.selectedDepartment!.id)
              .toList()
        : <Activity>[];

    final bool endTimeBeforeStart = _isEndBeforeStart(state);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Log New Activity'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 100), // extra bottom padding
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ═══ Section Title ═══════════════════════════════════════
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Activity Setup',
                    style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
                  ),
                  Text(
                    'Required >',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // ═══ 1. Sales Order ═══════════════════════════════════════
              _SalesOrderDropdown(
                selectedSO: state.selectedSO,
                onChanged: notifier.selectSalesOrder,
              ),
              const SizedBox(height: 12),

              // ═══ 2. Department ════════════════════════════════════════
              _DepartmentDropdown(
                selectedDepartment: state.selectedDepartment,
                onChanged: notifier.selectDepartment,
              ),
              const SizedBox(height: 12),

              // ═══ 3. Activity ═════════════════════════════════════════
              _ActivityDropdown(
                activities: filteredActivities,
                selectedActivity: state.selectedActivity,
                enabled: state.selectedDepartment != null,
                onChanged: notifier.selectActivity,
              ),
              const SizedBox(height: 8),

              // ═══ 3a. Other Activity Warning ══════════════════════════
              if (state.isOtherActivity) ...[
                const SizedBox(height: 8),
                _OtherActivityWarning(
                  reason: state.otherActivityReason,
                  onChanged: notifier.setOtherActivityReason,
                ),
              ],
              const SizedBox(height: 24),

              // ═══ Section Title ═══════════════════════════════════════
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Time Entry',
                    style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // ═══ 4. Time Entry ═══════════════════════════════════════
              _TimeEntrySection(
                startTime: state.startTime,
                endTime: state.endTime,
                endTimeBeforeStart: endTimeBeforeStart,
                onStartSelected: notifier.setStartTime,
                onEndSelected: notifier.setEndTime,
              ),
              const SizedBox(height: 24),

              // ═══ Section Title ═══════════════════════════════════════
              Text(
                'Team',
                style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
              ),
              const SizedBox(height: 16),

              // ═══ 5. Coworker ═════════════════════════════════════════
              const CoworkerSection(),
              const SizedBox(height: 24),

              // ═══ Section Title ═══════════════════════════════════════
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Your progress',
                    style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
                  ),
                  Text(
                    'See summary >',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // ═══ 6. Productivity Summary ═════════════════════════════
              const ProductivitySummaryCard(),
              const SizedBox(height: 32),

              // ═══ 7. Submit Button ════════════════════════════════════
              SizedBox(
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: state.canSubmit ? () => notifier.submit() : null,
                  icon: const Icon(Icons.send_rounded, size: 20),
                  label: const Text('Submit Report'),
                  style: ElevatedButton.styleFrom(
                    disabledBackgroundColor: theme.colorScheme.surface,
                    disabledForegroundColor: Colors.grey.shade600,
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
                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Text(next.submitSuccessMessage!),
              ],
            ),
            backgroundColor: const Color(0xFF5C7862), // match primary theme color
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
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
//  Private section widgets
// ══════════════════════════════════════════════════════════════════════════

class _SalesOrderDropdown extends StatelessWidget {
  const _SalesOrderDropdown({
    required this.selectedSO,
    required this.onChanged,
  });

  final SalesOrder? selectedSO;
  final ValueChanged<SalesOrder?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<SalesOrder>(
      key: ValueKey(selectedSO),
      initialValue: selectedSO,
      icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white),
      decoration: const InputDecoration(
        labelText: 'Sales Order',
        prefixIcon: Icon(Icons.receipt_long_outlined),
      ),
      hint: const Text('Select sales order'),
      dropdownColor: const Color(0xFF262628),
      items: mockSalesOrders.map((so) {
        return DropdownMenuItem(value: so, child: Text(so.label, style: const TextStyle(color: Colors.white)));
      }).toList(),
      onChanged: onChanged,
    );
  }
}

class _DepartmentDropdown extends StatelessWidget {
  const _DepartmentDropdown({
    required this.selectedDepartment,
    required this.onChanged,
  });

  final Department? selectedDepartment;
  final ValueChanged<Department?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<Department>(
      key: ValueKey(selectedDepartment),
      initialValue: selectedDepartment,
      icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white),
      decoration: const InputDecoration(
        labelText: 'Department',
        prefixIcon: Icon(Icons.business_outlined),
      ),
      hint: const Text('Select department'),
      dropdownColor: const Color(0xFF262628),
      items: mockDepartments.map((dept) {
        return DropdownMenuItem(value: dept, child: Text(dept.name, style: const TextStyle(color: Colors.white)));
      }).toList(),
      onChanged: onChanged,
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
      key: ValueKey(selectedActivity),
      initialValue: selectedActivity,
      icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white),
      decoration: InputDecoration(
        labelText: 'Activity',
        prefixIcon: const Icon(Icons.task_alt_outlined),
        hintText: enabled ? 'Select activity' : 'Select a department first',
      ),
      dropdownColor: const Color(0xFF262628),
      items: activities.map((act) {
        return DropdownMenuItem(
          value: act,
          child: Text('${act.activityCode} — ${act.activityName}', style: const TextStyle(color: Colors.white)),
        );
      }).toList(),
      onChanged: enabled ? onChanged : null,
    );
  }
}

class _OtherActivityWarning extends StatelessWidget {
  const _OtherActivityWarning({
    required this.reason,
    required this.onChanged,
  });

  final String reason;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    const warningColor = Color(0xFFFF735D); // matching coral

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: warningColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: warningColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: warningColor, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Outside assigned role',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: warningColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            decoration: InputDecoration(
              labelText: 'Reason (required)',
              hintText: 'Why are you performing this?',
              fillColor: theme.scaffoldBackgroundColor, // dark bg inside card
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            maxLines: 2,
            onChanged: onChanged,
            controller: _OtherActivityReasonController(reason),
          ),
        ],
      ),
    );
  }
}

class _OtherActivityReasonController extends TextEditingController {
  _OtherActivityReasonController(String initial) : super(text: initial);
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
              color: const Color(0xFF262628),
              borderRadius: BorderRadius.circular(16),
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
              color: const Color(0xFF262628),
              borderRadius: BorderRadius.circular(16),
              border: endTimeBeforeStart ? Border.all(color: Colors.redAccent) : null,
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
