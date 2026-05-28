import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/mock_data.dart';
import '../domain/daily_report_notifier.dart';
import '../domain/daily_report_state.dart';
import '../widgets/coworker_section.dart';
import '../widgets/productivity_summary_card.dart';
import '../widgets/time_picker_row.dart';

/// Main Daily Report form screen.
///
/// Assembles all form sections and wires them to the [dailyReportProvider].
/// This widget is **presentation-only** — every validation result, derived
/// value, and enable/disable decision comes from [DailyReportState] getters
/// or notifier methods.
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

    // ── End-time-before-start validation (UI hint only) ───────────────
    final bool endTimeBeforeStart = _isEndBeforeStart(state);

    return Scaffold(
      appBar: AppBar(title: const Text('Daily Activity Log')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ═══ 1. Sales Order ═══════════════════════════════════════
            _SalesOrderDropdown(
              selectedSO: state.selectedSO,
              onChanged: notifier.selectSalesOrder,
            ),
            const SizedBox(height: 16),

            // ═══ 2. Department ════════════════════════════════════════
            _DepartmentDropdown(
              selectedDepartment: state.selectedDepartment,
              onChanged: notifier.selectDepartment,
            ),
            const SizedBox(height: 16),

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
            const SizedBox(height: 16),

            // ═══ 4. Time Entry ═══════════════════════════════════════
            _TimeEntrySection(
              startTime: state.startTime,
              endTime: state.endTime,
              endTimeBeforeStart: endTimeBeforeStart,
              onStartSelected: notifier.setStartTime,
              onEndSelected: notifier.setEndTime,
            ),
            const SizedBox(height: 16),

            // ═══ 5. Coworker ═════════════════════════════════════════
            const CoworkerSection(),
            const SizedBox(height: 20),

            // ═══ 6. Productivity Summary ═════════════════════════════
            const ProductivitySummaryCard(),
            const SizedBox(height: 24),

            // ═══ 7. Submit Button ════════════════════════════════════
            SizedBox(
              height: 50,
              child: ElevatedButton.icon(
                onPressed: state.canSubmit ? () => notifier.submit() : null,
                icon: const Icon(Icons.send_rounded, size: 20),
                label: const Text('Submit Report'),
                style: ElevatedButton.styleFrom(
                  disabledBackgroundColor:
                      theme.colorScheme.primary.withValues(alpha: 0.25),
                  disabledForegroundColor: Colors.white60,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Helpers (no business logic — purely presentation support)
  // ────────────────────────────────────────────────────────────────────────

  /// Returns `true` when both times are set and endTime ≤ startTime.
  static bool _isEndBeforeStart(DailyReportState state) {
    if (state.startTime == null || state.endTime == null) return false;
    final s = state.startTime!.hour * 60 + state.startTime!.minute;
    final e = state.endTime!.hour * 60 + state.endTime!.minute;
    return e <= s;
  }

  /// Listens for [submitSuccessMessage] in state and shows a snackbar.
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
            backgroundColor: const Color(0xFF2E7D32),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            duration: const Duration(seconds: 3),
          ),
        );
        // Clear so it doesn't re-trigger on rebuild.
        ref.read(dailyReportProvider.notifier).clearSubmitSuccess();
      }
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Private section widgets — small, focused, presentation-only
// ══════════════════════════════════════════════════════════════════════════

// ── Sales Order Dropdown ─────────────────────────────────────────────────

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
      decoration: const InputDecoration(
        labelText: 'Sales Order',
        prefixIcon: Icon(Icons.receipt_long_outlined),
      ),
      hint: const Text('Select sales order'),
      items: mockSalesOrders.map((so) {
        return DropdownMenuItem(value: so, child: Text(so.label));
      }).toList(),
      onChanged: onChanged,
    );
  }
}

// ── Department Dropdown ──────────────────────────────────────────────────

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
      decoration: const InputDecoration(
        labelText: 'Department',
        prefixIcon: Icon(Icons.business_outlined),
      ),
      hint: const Text('Select department'),
      items: mockDepartments.map((dept) {
        return DropdownMenuItem(value: dept, child: Text(dept.name));
      }).toList(),
      onChanged: onChanged,
    );
  }
}

// ── Activity Dropdown ────────────────────────────────────────────────────

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
      decoration: InputDecoration(
        labelText: 'Activity',
        prefixIcon: const Icon(Icons.task_alt_outlined),
        hintText: enabled ? 'Select activity' : 'Select a department first',
      ),
      items: activities.map((act) {
        return DropdownMenuItem(
          value: act,
          child: Text('${act.activityCode} — ${act.activityName}'),
        );
      }).toList(),
      onChanged: enabled ? onChanged : null,
    );
  }
}

// ── Other Activity Warning ───────────────────────────────────────────────

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
    const warningOrange = Color(0xFFE65100);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF3E0), // light orange
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: warningOrange.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded,
                  color: warningOrange, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'This activity is outside your assigned role.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: warningOrange,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            decoration: InputDecoration(
              labelText: 'Reason (required)',
              hintText: 'Why are you performing this activity?',
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
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

/// Tiny helper so the text field stays in sync if state resets the reason
/// (e.g. on activity change) without creating a full StatefulWidget.
class _OtherActivityReasonController extends TextEditingController {
  _OtherActivityReasonController(String initial) : super(text: initial);
}

// ── Time Entry Section ───────────────────────────────────────────────────

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
          child: TimePickerRow(
            label: 'Start Time',
            selectedTime: startTime,
            onTimeSelected: onStartSelected,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: TimePickerRow(
            label: 'End Time',
            selectedTime: endTime,
            onTimeSelected: onEndSelected,
            errorText: endTimeBeforeStart ? 'Before start' : null,
          ),
        ),
      ],
    );
  }
}
