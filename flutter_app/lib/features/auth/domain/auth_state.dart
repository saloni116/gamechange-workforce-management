/// Lightweight authentication state for the auth feature module.
///
/// Uses an immutable data class with [copyWith] for safe state transitions.
class AuthState {
  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.token,
    this.errorMessage,
  });

  /// Whether an auth request (login/logout) is in progress.
  final bool isLoading;

  /// Whether the user is currently authenticated.
  final bool isAuthenticated;

  /// JWT or session token received from the server.
  final String? token;

  /// Human-readable error message from the last failed attempt.
  final String? errorMessage;

  /// Creates a copy with the specified fields overridden.
  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    String? token,
    String? errorMessage,
    bool clearError = false,
    bool clearToken = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      token: clearToken ? null : (token ?? this.token),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AuthState &&
          runtimeType == other.runtimeType &&
          isLoading == other.isLoading &&
          isAuthenticated == other.isAuthenticated &&
          token == other.token &&
          errorMessage == other.errorMessage;

  @override
  int get hashCode => Object.hash(isLoading, isAuthenticated, token, errorMessage);

  @override
  String toString() =>
      'AuthState(isLoading: $isLoading, isAuthenticated: $isAuthenticated, '
      'token: ${token != null ? "***" : "null"}, errorMessage: $errorMessage)';
}
