import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'auth_state.dart';

/// Riverpod [StateNotifier] that manages authentication state.
///
/// **Rules followed:**
/// - Matches existing project pattern (StateNotifier + StateNotifierProvider).
/// - All business logic lives here (not in widgets).
/// - State is replaced immutably via [AuthState.copyWith].
/// - Does NOT perform navigation — only updates state.
/// - Does NOT depend on any existing notifier/provider.
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _checkInitialAuth();
  }

  /// Checks if a valid token is already saved in Hive on boot.
  void _checkInitialAuth() {
    try {
      final authBox = Hive.box('authBox');
      final token = authBox.get('token') as String?;
      if (token != null) {
        state = AuthState(
          isAuthenticated: true,
          token: token,
        );
        debugPrint('🔑 Found existing token in Hive. Authenticated user.');
      }
    } catch (e) {
      debugPrint('⚠️ Error checking initial Hive token: $e');
    }
  }

  /// Dio instance for auth API calls.
  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  // ────────────────────────────────────────────────────────────────────────
  // Login
  // ────────────────────────────────────────────────────────────────────────

  /// Attempts login with [employeeId] and [password].
  ///
  /// 1. Sets loading state.
  /// 2. Tries real API call to backend (placeholder URL).
  /// 3. On network failure (backend not ready), falls back to mock response.
  /// 4. Saves token to Hive `authBox`.
  /// 5. Updates state to authenticated or error — never navigates.
  Future<void> login(String employeeId, String password) async {
    // Clear previous error and set loading
    state = state.copyWith(
      isLoading: true,
      clearError: true,
    );

    try {
      // Attempt real API call (will fail until backend is ready)
      final response = await _dio.post(
        'http://PLACEHOLDER_URL/auth/login',
        data: {
          'employeeId': employeeId,
          'password': password,
        },
      );

      final token = response.data['token'] as String;
      await _saveTokenAndAuthenticate(token);
    } catch (e) {
      // ── Backend not ready — simulate mock response ───────────────────
      debugPrint('⚠️ Auth API unreachable, using mock login: $e');

      await Future.delayed(const Duration(seconds: 1));

      // Guard: notifier may have been disposed during the delay
      if (!mounted) return;

      // Simulate a failure for testing if employeeId or password is 'invalid'
      if (employeeId.toLowerCase() == 'invalid' || password.toLowerCase() == 'invalid') {
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          errorMessage: 'Invalid Employee ID or password. Please try again.',
        );
        return;
      }

      // Generate mock token based on employee ID
      final mockToken = employeeId.toLowerCase().contains('admin')
          ? 'mock_admin_token_${DateTime.now().millisecondsSinceEpoch}'
          : 'mock_worker_token_${DateTime.now().millisecondsSinceEpoch}';

      await _saveTokenAndAuthenticate(mockToken);
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Logout
  // ────────────────────────────────────────────────────────────────────────

  /// Clears token from Hive and resets state.
  Future<void> logout() async {
    final authBox = Hive.box('authBox');
    await authBox.delete('token');

    state = const AuthState();

    debugPrint('🔒 User logged out, token cleared.');
  }

  // ────────────────────────────────────────────────────────────────────────
  // Helpers (private)
  // ────────────────────────────────────────────────────────────────────────

  /// Persists [token] into Hive and updates state to authenticated.
  Future<void> _saveTokenAndAuthenticate(String token) async {
    final authBox = Hive.box('authBox');
    await authBox.put('token', token);

    if (!mounted) return;

    state = state.copyWith(
      isLoading: false,
      isAuthenticated: true,
      token: token,
      clearError: true,
    );

    debugPrint('✅ Auth success — token saved to Hive: ${token.substring(0, token.length.clamp(0, 20))}...');
  }

  /// Clears any displayed error message.
  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────────────────

/// Global Riverpod provider for the Auth feature.
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(),
);
