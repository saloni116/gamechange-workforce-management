import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../daily_report/data/mock_data.dart';
import '../../daily_report/domain/daily_report_notifier.dart';

/// Provider for viewing the submitted activity report history.
/// Watches [dailyReportProvider] to reactively update whenever a new report is submitted.
final historyProvider = Provider<List<SubmittedReport>>((ref) {
  ref.watch(dailyReportProvider);

  // Return a new list of submitted reports sorted newest first by submittedDate
  final list = List<SubmittedReport>.from(mockSubmittedReports);
  list.sort((a, b) => b.submittedDate.compareTo(a.submittedDate));
  return list;
});
