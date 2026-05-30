import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/admin/presentation/admin_dashboard_stub.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/daily_report/presentation/daily_report_screen.dart';
import '../features/history/presentation/history_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../shared/widgets/app_scaffold.dart';

/// Application route paths.
abstract class AppRoutes {
  static const String login = '/login';
  static const String report = '/report';
  static const String history = '/history';
  static const String profile = '/profile';
  static const String admin = '/admin';
}

/// Simple notifier to communicate auth state changes reactively to GoRouter.
class AuthChangeNotifier extends ChangeNotifier {
  String? _token;
  bool _isAuthenticated = false;

  String? get token => _token;
  bool get isAuthenticated => _isAuthenticated;

  void update(String? token, bool isAuthenticated) {
    if (_token != token || _isAuthenticated != isAuthenticated) {
      _token = token;
      _isAuthenticated = isAuthenticated;
      notifyListeners();
    }
  }
}

/// Global listenable that triggers GoRouter redirects on auth state changes.
final AuthChangeNotifier authChangeNotifier = AuthChangeNotifier();

/// GoRouter configuration with ShellRoute for persistent bottom navigation.
final GoRouter appRouter = GoRouter(
  initialLocation: AppRoutes.report,
  refreshListenable: authChangeNotifier,
  redirect: (context, state) {
    final isAuthenticated = authChangeNotifier.isAuthenticated;
    final token = authChangeNotifier.token ?? '';
    final isLoggingIn = state.uri.path == AppRoutes.login;

    // 1. If not authenticated -> Login Screen
    if (!isAuthenticated) {
      return isLoggingIn ? null : AppRoutes.login;
    }

    // 2. If authenticated AND token contains "mock_admin_token" -> Admin Dashboard
    if (token.contains('mock_admin_token')) {
      if (state.uri.path == AppRoutes.admin) return null;
      return AppRoutes.admin;
    }

    // 3. If authenticated AND token contains "mock_worker_token" -> Existing Worker App
    if (token.contains('mock_worker_token')) {
      if (state.uri.path == AppRoutes.admin || state.uri.path == AppRoutes.login) {
        return AppRoutes.report;
      }
    }

    return null;
  },
  routes: [
    GoRoute(
      path: AppRoutes.login,
      pageBuilder: (context, state) => const NoTransitionPage(
        child: LoginScreen(),
      ),
    ),
    GoRoute(
      path: AppRoutes.admin,
      pageBuilder: (context, state) => const NoTransitionPage(
        child: AdminDashboardStub(),
      ),
    ),
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
