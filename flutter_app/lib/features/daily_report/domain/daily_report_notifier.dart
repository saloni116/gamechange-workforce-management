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
      otherActivityReason: '',
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Activity
  // ────────────────────────────────────────────────────────────────────────

  /// When an activity is selected, the [isOtherActivity] flag is set based
  /// on [Activity.isInRole]. If `isInRole` is `false`, it's considered an
  /// "other" activity and a reason will be required before submission.
  void selectActivity(Activity? activity) {
    state = state.copyWith(
      selectedActivity: activity,
      clearSelectedActivity: activity == null,
      isOtherActivity: activity != null ? !activity.isInRole : false,
      // Reset the reason when switching activities
      otherActivityReason: '',
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
  // Submission (mock — console only)
  // ────────────────────────────────────────────────────────────────────────

  /// Builds a structured payload from the current state and prints it to
  /// the debug console. Sets [submitSuccessMessage] so the UI layer can
  /// react (e.g. show a snackbar). Does NOT call any API.
  void submit() {
    if (!state.canSubmit) return;

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

    state = state.copyWith(
      submitSuccessMessage: 'Report submitted successfully!',
    );
  }

  /// Clears the success message so subsequent builds don't re‑trigger
  /// the snackbar.
  void clearSubmitSuccess() {
    state = state.copyWith(clearSubmitSuccessMessage: true);
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
