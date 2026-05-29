import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// The state of the authentication.
class AuthState {
  const AuthState({
    this.isAuthenticated = false,
    this.employeeId,
    this.loginTime,
    this.isLoading = false,
    this.error,
  });

  final bool isAuthenticated;
  final String? employeeId;
  final DateTime? loginTime;
  final bool isLoading;
  final String? error;

  AuthState copyWith({
    bool? isAuthenticated,
    String? employeeId,
    DateTime? loginTime,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      employeeId: employeeId ?? this.employeeId,
      loginTime: loginTime ?? this.loginTime,
      isLoading: isLoading ?? this.isLoading,
      error: error, // Can be null intentionally to clear errors
    );
  }
}

/// A notifier that manages the mocked authentication state.
class AuthNotifier extends Notifier<AuthState> {
  Timer? _autoLogoutTimer;

  @override
  AuthState build() {
    ref.onDispose(() {
      _autoLogoutTimer?.cancel();
    });
    return const AuthState();
  }

  /// Simulates a login request.
  Future<void> login(String employeeId, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));

    if (employeeId.trim().isEmpty || password.trim().isEmpty) {
      state = state.copyWith(
        isLoading: false,
        error: 'Employee ID and Password cannot be empty.',
      );
      return;
    }

    // Cancel any pre-existing timer
    _autoLogoutTimer?.cancel();

    // Set auto-logout timer to 23 hours and 50 minutes
    _autoLogoutTimer = Timer(const Duration(hours: 23, minutes: 50), () {
      logout();
    });

    // Accept any non-empty credentials for now
    state = state.copyWith(
      isLoading: false,
      isAuthenticated: true,
      employeeId: employeeId.trim(),
      loginTime: DateTime.now(),
    );
  }

  /// Logs the user out.
  void logout() {
    _autoLogoutTimer?.cancel();
    state = const AuthState();
  }
}

/// The main provider for authentication state.
final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});

/// A listenable wrapper around the authProvider so GoRouter can automatically
/// refresh its routes when the authentication state changes.
class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen(
          (dynamic _) => notifyListeners(),
        );
  }

  late final _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
