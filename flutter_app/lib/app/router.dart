import 'package:go_router/go_router.dart';

import '../features/daily_report/presentation/daily_report_screen.dart';
import '../screens/history/history_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../shared/widgets/app_scaffold.dart';

/// Application route paths.
abstract class AppRoutes {
  static const String report = '/report';
  static const String history = '/history';
  static const String profile = '/profile';
}

/// GoRouter configuration with ShellRoute for persistent bottom navigation.
final GoRouter appRouter = GoRouter(
  initialLocation: AppRoutes.report,
  routes: [
    ShellRoute(
      builder: (context, state, child) {
        return AppScaffold(
          currentPath: state.uri.path,
          child: child,
        );
      },
      routes: [
        GoRoute(
          path: AppRoutes.report,
          pageBuilder: (context, state) => const NoTransitionPage(
            child: DailyReportScreen(),
          ),
        ),
        GoRoute(
          path: AppRoutes.history,
          pageBuilder: (context, state) => const NoTransitionPage(
            child: HistoryScreen(),
          ),
        ),
        GoRoute(
          path: AppRoutes.profile,
          pageBuilder: (context, state) => const NoTransitionPage(
            child: ProfileScreen(),
          ),
        ),
      ],
    ),
  ],
);
