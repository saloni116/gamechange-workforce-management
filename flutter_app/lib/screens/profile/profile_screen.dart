import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/domain/auth_notifier.dart';

/// Enhanced Screen for the worker's profile.
///
/// Displays Employee ID, User Type, Authentication Status, and Hive Token Status
/// in factory-oriented UI cards, reading data directly from the active [AuthState].
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final authState = ref.watch(authProvider);

    final token = authState.token ?? '';
    final isAuthenticated = authState.isAuthenticated;

    // Detect user type based on token structure
    final String userType;
    if (token.contains('mock_admin_token')) {
      userType = 'Administrator';
    } else if (token.contains('mock_worker_token')) {
      userType = 'Factory Worker';
    } else {
      userType = 'Unknown';
    }

    // Determine storage status
    final tokenStatus = token.isNotEmpty ? 'Stored (Hive Box)' : 'Not Stored';
    final authStatusText = isAuthenticated ? 'Authenticated (Active Session)' : 'Not Authenticated';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Worker Profile'),
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: colorScheme.onSurface,
      ),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              colorScheme.surface,
              colorScheme.primary.withValues(alpha: 0.02),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // ── Profile Avatar Header ─────────────────────────────────────
                const SizedBox(height: 8),
                CircleAvatar(
                  radius: 50,
                  backgroundColor: colorScheme.primary.withValues(alpha: 0.1),
                  child: Icon(
                    Icons.engineering_rounded,
                    size: 52,
                    color: colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  userType,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: colorScheme.primary,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  'Workforce Management Hub',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
                const SizedBox(height: 32),

                // ── Info Cards Container ──────────────────────────────────────
                _buildInfoCard(
                  context,
                  icon: Icons.badge_outlined,
                  title: 'Employee ID',
                  value: 'Will be available after backend integration',
                  isWarning: true,
                ),
                const SizedBox(height: 16),

                _buildInfoCard(
                  context,
                  icon: Icons.person_pin_outlined,
                  title: 'User Type / Role',
                  value: userType,
                ),
                const SizedBox(height: 16),

                _buildInfoCard(
                  context,
                  icon: Icons.verified_user_outlined,
                  title: 'Authentication Status',
                  value: authStatusText,
                  badgeColor: Colors.green.shade600,
                ),
                const SizedBox(height: 16),

                _buildInfoCard(
                  context,
                  icon: Icons.sd_storage_outlined,
                  title: 'Token Storage Status',
                  value: tokenStatus,
                  badgeColor: Colors.blue.shade600,
                ),
                const SizedBox(height: 40),

                // ── Sign Out Button ──────────────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      ref.read(authProvider.notifier).logout();
                    },
                    icon: const Icon(Icons.logout_rounded, color: Colors.redAccent),
                    label: const Text(
                      'Sign Out',
                      style: TextStyle(
                        color: Colors.redAccent,
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.redAccent, width: 1.2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ─── Reusable Profile Info Card ─────────────────────────────────────────
  Widget _buildInfoCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String value,
    bool isWarning = false,
    Color? badgeColor,
  }) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      elevation: 2,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: colorScheme.outline.withValues(alpha: 0.08),
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 18.0),
        child: Row(
          children: [
            // Left Icon Box
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: (badgeColor ?? colorScheme.primary).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: badgeColor ?? colorScheme.primary,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            // Right Text Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurface.withValues(alpha: 0.5),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isWarning
                          ? Colors.orange.shade800
                          : colorScheme.onSurface,
                      fontStyle: isWarning ? FontStyle.italic : FontStyle.normal,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
