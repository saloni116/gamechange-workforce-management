import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/mock_data.dart';
import 'daily_report_state.dart';

/// Riverpod [StateNotifier] that owns all mutations and validations for the
/// Daily Report form.
///
/// **Rules followed:**
/// - All business logic lives here (not in widgets).
/// - State is replaced immutably via [DailyReportState.copyWith].
/// - Calculations / derived values are state getters, NOT notifier methods.
class DailyReportNotifier extends StateNotifier<DailyReportState> {
  DailyReportNotifier() : super(const DailyReportState());

  // ────────────────────────────────────────────────────────────────────────
  // Sales Order
  // ────────────────────────────────────────────────────────────────────────

  void selectSalesOrder(SalesOrder? so) {
    state = state.copyWith(
      selectedSO: so,
      clearSelectedSO: so == null,
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Department
  // ────────────────────────────────────────────────────────────────────────

  /// When the department changes, the selected activity is cleared because
  /// the activity list is department‑scoped.
  void selectDepartment(Department? department) {
    state = state.copyWith(
      selectedDepartment: department,
      clearSelectedDepartment: department == null,
      // Clear downstream selections
      clearSelectedActivity: true,
      isOtherActivity: false,
      showAllActivities: false,
      otherActivityReason: '',
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Activity
  // ────────────────────────────────────────────────────────────────────────

  /// When an activity is selected, the [isOtherActivity] flag is set
  /// based on [Activity.isInRole] or if the activity belongs to a different department.
  /// If it is considered an "other" activity, a reason will be required.
  void selectActivity(Activity? activity) {
    final isOther = activity != null
        ? (activity.isInRole == false ||
            (state.selectedDepartment != null &&
                activity.departmentId != state.selectedDepartment!.id))
        : false;
    state = state.copyWith(
      selectedActivity: activity,
      clearSelectedActivity: activity == null,
      isOtherActivity: isOther,
      // Reset the reason when switching activities
      otherActivityReason: '',
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Show All Activities toggle
  // ────────────────────────────────────────────────────────────────────────

  /// Safely toggles the [showAllActivities] flag.
  ///
  /// When `true`: UI shows the full activity list from mock data.
  /// When `false`: UI shows only department-filtered activities.
  /// If toggling off, resets the selected activity if it belongs to another department.
  void toggleShowAllActivities(bool value) {
    final activity = state.selectedActivity;
    final dept = state.selectedDepartment;

    bool clearActivity = false;
    Activity? nextActivity = activity;
    bool nextIsOther = state.isOtherActivity;
    String nextReason = state.otherActivityReason;

    if (!value && activity != null && dept != null) {
      if (activity.departmentId != dept.id) {
        nextActivity = null;
        clearActivity = true;
        nextIsOther = false;
        nextReason = '';
      }
    }

    state = state.copyWith(
      showAllActivities: value,
      selectedActivity: nextActivity,
      clearSelectedActivity: clearActivity,
      isOtherActivity: nextIsOther,
      otherActivityReason: nextReason,
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Time
  // ────────────────────────────────────────────────────────────────────────

  void setStartTime(TimeOfDay time) {
    state = state.copyWith(startTime: time);
  }

  void setEndTime(TimeOfDay time) {
    state = state.copyWith(endTime: time);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Coworker
  // ────────────────────────────────────────────────────────────────────────

  /// Toggles the "has coworker" switch. When turned off, clears all
  /// coworker‑related fields.
  void toggleCoworker(bool enabled) {
    state = state.copyWith(
      hasCoworker: enabled,
      coworkerIdInput: enabled ? state.coworkerIdInput : '',
      clearVerifiedCoworker: !enabled,
      clearCoworkerError: !enabled,
      isVerifyingCoworker: false,
    );
  }

  void setCoworkerId(String id) {
    state = state.copyWith(
      coworkerIdInput: id,
      // Reset verification when the input changes
      clearVerifiedCoworker: true,
      clearCoworkerError: true,
    );
  }

  /// Asynchronous mock verification of a coworker employee ID.
  ///
  /// - Sets [isVerifyingCoworker] while the lookup is in progress.
  /// - Simulates a 200 ms network delay.
  /// - Looks up the ID in [mockCoworkerDirectory].
  /// - Sets either [verifiedCoworker] or [coworkerError].
  Future<void> verifyCoworker() async {
    final idToFind = state.coworkerIdInput.trim();

    if (idToFind.isEmpty) {
      state = state.copyWith(coworkerError: 'Employee ID cannot be empty.');
      return;
    }

    // Start loading
    state = state.copyWith(
      isVerifyingCoworker: true,
      clearCoworkerError: true,
      clearVerifiedCoworker: true,
    );

    // Simulate async lookup
    await Future.delayed(const Duration(milliseconds: 200));

    // Guard: if user toggled off coworker during the delay, bail out.
    if (!state.hasCoworker) return;

    final match = mockCoworkerDirectory.cast<Coworker?>().firstWhere(
          (c) => c!.employeeId == idToFind,
          orElse: () => null,
        );

    if (match != null) {
      state = state.copyWith(
        verifiedCoworker: match,
        isVerifyingCoworker: false,
        clearCoworkerError: true,
      );
    } else {
      state = state.copyWith(
        coworkerError: 'Employee "$idToFind" not found in directory.',
        isVerifyingCoworker: false,
        clearVerifiedCoworker: true,
      );
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Other Activity Reason
  // ────────────────────────────────────────────────────────────────────────

  void setOtherActivityReason(String reason) {
    state = state.copyWith(otherActivityReason: reason);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Submission (mock — duplicate guard + console payload)
  // ────────────────────────────────────────────────────────────────────────

  /// Builds a structured payload from the current state, checks for
  /// duplicate entries against [mockSubmittedReports], and on success
  /// appends the new report to the mock list.
  ///
  /// **Duplicate Guard rule:**
  /// Block submission if a report with the SAME Sales Order, Department,
  /// Activity, and calendar date already exists. Compare only the date
  /// portion — ignore the time.
  void submit() {
    if (!state.canSubmit) return;

    // Always clear previous submission errors before a new attempt.
    state = state.copyWith(
      clearDuplicateError: true,
      clearSubmitErrorMessage: true,
      clearSubmitSuccessMessage: true,
    );

    // ── Validate required selections exist ─────────────────────────────
    if (state.selectedSO == null ||
        state.selectedDepartment == null ||
        state.selectedActivity == null) {
      state = state.copyWith(
        submitErrorMessage: 'Please fill in all required fields.',
      );
      return;
    }

    // ── Duplicate guard ────────────────────────────────────────────────
    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);

    final isDuplicate = mockSubmittedReports.any((report) {
      // Bypass duplicate guard against itself if currently editing
      if (state.editingReportId == report.reportId) {
        return false;
      }
      final reportDate = DateTime(
        report.submittedDate.year,
        report.submittedDate.month,
        report.submittedDate.day,
      );
      return report.salesOrderId == state.selectedSO!.id &&
          report.departmentId == state.selectedDepartment!.id &&
          report.activityId == state.selectedActivity!.id &&
          reportDate == todayDate;
    });

    if (isDuplicate) {
      state = state.copyWith(
        duplicateError:
            'This activity already exists for today. '
            'Additional work must be added as an Additional Time Slot.',
      );
      return;
    }

    // ── Build debug payload (preserved from Day 1) ─────────────────────
    final payload = <String, dynamic>{
      'salesOrder': state.selectedSO?.id,
      'department': state.selectedDepartment?.name,
      'activity': state.selectedActivity?.activityName,
      'activityCode': state.selectedActivity?.activityCode,
      'startTime': state.startTime != null
          ? '${state.startTime!.hour.toString().padLeft(2, '0')}:${state.startTime!.minute.toString().padLeft(2, '0')}'
          : null,
      'endTime': state.endTime != null
          ? '${state.endTime!.hour.toString().padLeft(2, '0')}:${state.endTime!.minute.toString().padLeft(2, '0')}'
          : null,
      'durationMinutes': state.durationMinutes,
      'hasCoworker': state.hasCoworker,
      'coworkerId': state.verifiedCoworker?.employeeId,
      'coworkerName': state.verifiedCoworker?.name,
      'totalWorkers': state.totalWorkers,
      'actualManMinutes': state.actualManMinutes,
      'standardManMinutes': state.selectedActivity?.standardManMinutes,
      'productivityPercent':
          double.parse(state.productivityPercent.toStringAsFixed(1)),
      'isOtherActivity': state.isOtherActivity,
      'otherActivityReason':
          state.isOtherActivity ? state.otherActivityReason : null,
    };

    debugPrint('══════════════════════════════════════════════════════');
    debugPrint('📋 DAILY REPORT PAYLOAD');
    debugPrint('══════════════════════════════════════════════════════');
    payload.forEach((key, value) {
      debugPrint('  $key: $value');
    });
    debugPrint('══════════════════════════════════════════════════════');

    final nextId = 'REP-${DateTime.now().millisecondsSinceEpoch}';
    final startStr = state.startTime != null
        ? '${state.startTime!.hour.toString().padLeft(2, '0')}:${state.startTime!.minute.toString().padLeft(2, '0')}'
        : '';
    final endStr = state.endTime != null
        ? '${state.endTime!.hour.toString().padLeft(2, '0')}:${state.endTime!.minute.toString().padLeft(2, '0')}'
        : '';

    final updatedReport = SubmittedReport(
      reportId: state.editingReportId ?? nextId,
      salesOrderId: state.selectedSO!.id,
      departmentId: state.selectedDepartment!.id,
      activityId: state.selectedActivity!.id,
      salesOrder: state.selectedSO!.id,
      department: state.selectedDepartment!.name,
      activity: state.selectedActivity!.activityName,
      startTime: startStr,
      endTime: endStr,
      durationMinutes: state.durationMinutes,
      productivityPercent:
          double.parse(state.productivityPercent.toStringAsFixed(1)),
      workerName: 'Main Operator',
      workerRole: 'Production Worker',
      submittedDate: todayDate,
      status: 'Pending', // Resubmitted rework goes back to pending approval
      coworkerId: state.verifiedCoworker?.employeeId,
      coworkerName: state.verifiedCoworker?.name,
      otherActivityReason: state.isOtherActivity ? state.otherActivityReason : null,
    );

    // ── Insert or Update mock submitted reports ────────────────────────
    if (state.editingReportId != null) {
      final index = mockSubmittedReports.indexWhere((r) => r.reportId == state.editingReportId);
      if (index != -1) {
        mockSubmittedReports[index] = updatedReport;
        debugPrint('✅ Report updated in-place (Rework). ID: ${state.editingReportId}');
      } else {
        mockSubmittedReports.add(updatedReport);
      }
    } else {
      mockSubmittedReports.add(updatedReport);
      debugPrint('✅ New report appended. Total submitted: ${mockSubmittedReports.length}');
    }

    state = state.copyWith(
      submitSuccessMessage: 'Report submitted successfully!',
      clearDuplicateError: true,
      clearSubmitErrorMessage: true,
      clearEditingReportId: true,
    );
  }

  /// Clears the success message so subsequent builds don't re‑trigger
  /// the snackbar.
  void clearSubmitSuccess() {
    state = state.copyWith(clearSubmitSuccessMessage: true);
  }

  /// Clears the duplicate error (e.g. when user dismisses the banner).
  void clearDuplicateError() {
    state = state.copyWith(clearDuplicateError: true);
  }

  /// Clears the generic submit error.
  void clearSubmitError() {
    state = state.copyWith(clearSubmitErrorMessage: true);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Rework Flow
  // ────────────────────────────────────────────────────────────────────────

  /// Overwrites the current form state with details from an existing [SubmittedReport]
  /// to load it back for rework/editing.
  void loadReportForRework(SubmittedReport oldReport) {
    // 1. Resolve SalesOrder
    final so = mockSalesOrders.cast<SalesOrder?>().firstWhere(
          (s) => s!.id == oldReport.salesOrderId,
          orElse: () => null,
        );

    // 2. Resolve Department
    final dept = mockDepartments.cast<Department?>().firstWhere(
          (d) => d!.id == oldReport.departmentId,
          orElse: () => null,
        );

    // 3. Resolve Activity
    final activity = mockActivities.cast<Activity?>().firstWhere(
          (a) => a!.id == oldReport.activityId,
          orElse: () => null,
        );

    // 4. Parse Start & End Times
    final startTime = _parseTime(oldReport.startTime);
    final endTime = _parseTime(oldReport.endTime);

    // 5. Resolve Coworker
    final hasCoworker = oldReport.coworkerId != null;
    final coworker = hasCoworker
        ? mockCoworkerDirectory.cast<Coworker?>().firstWhere(
              (c) => c!.employeeId == oldReport.coworkerId,
              orElse: () => null,
            )
        : null;

    // 6. Resolve if Other Activity
    final isOther = activity != null
        ? (activity.isInRole == false || (dept != null && activity.departmentId != dept.id))
        : false;

    // 7. Should we show all activities?
    // If the activity belongs to another department, we must set showAllActivities to true
    final showAll = activity != null && dept != null && activity.departmentId != dept.id;

    // Safely overwrite entire state and clear any validation/submit errors
    state = DailyReportState(
      selectedSO: so,
      selectedDepartment: dept,
      selectedActivity: activity,
      startTime: startTime,
      endTime: endTime,
      hasCoworker: hasCoworker,
      coworkerIdInput: oldReport.coworkerId ?? '',
      verifiedCoworker: coworker,
      isOtherActivity: isOther,
      showAllActivities: showAll,
      otherActivityReason: oldReport.otherActivityReason ?? '',
      editingReportId: oldReport.reportId,
    );
  }

  /// Parses an "HH:MM" time string into [TimeOfDay]
  TimeOfDay? _parseTime(String timeStr) {
    if (timeStr.isEmpty) return null;
    final parts = timeStr.split(':');
    if (parts.length != 2) return null;
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) return null;
    return TimeOfDay(hour: hour, minute: minute);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────────────────

/// Global Riverpod provider for the Daily Report feature.
final dailyReportProvider =
    StateNotifierProvider<DailyReportNotifier, DailyReportState>(
  (ref) => DailyReportNotifier(),
);
