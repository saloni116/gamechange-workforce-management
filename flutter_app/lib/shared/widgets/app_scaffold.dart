import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/router.dart';
import '../../features/timer/domain/countdown_provider.dart';

/// Persistent scaffold wrapper used by the ShellRoute.
///
/// Provides a bottom navigation with a custom dark theme design,
/// and an optional global countdown banner at the top.
class AppScaffold extends ConsumerWidget {
  const AppScaffold({
    super.key,
    required this.child,
    required this.currentPath,
  });

  /// The page body injected by the ShellRoute.
  final Widget child;

  /// The current URI path, used to determine the active tab index.
  final String currentPath;

  // ─── Tab Definitions ──────────────────────────────────────────────
  static const List<_TabItem> _tabs = [
    _TabItem(
      path: AppRoutes.dashboard, // Updated to dashboard
      icon: Icons.home_outlined,
      selectedIcon: Icons.home_filled,
      label: 'Home',
    ),
    _TabItem(
      path: AppRoutes.history,
      icon: Icons.history_outlined,
      selectedIcon: Icons.history,
      label: 'History',
    ),
    _TabItem(
      path: AppRoutes.profile,
      icon: Icons.person_outline,
      selectedIcon: Icons.person,
      label: 'Profile',
    ),
  ];

  /// Determines the selected tab index from the current route path.
  int _selectedIndex() {
    for (int i = 0; i < _tabs.length; i++) {
      if (currentPath == _tabs[i].path || 
          (currentPath == AppRoutes.newActivity && i == 0)) {
        return i;
      }
    }
    return 0; // Default to Home
  }

  /// Formats duration into HH:MM:SS
  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final hours = twoDigits(duration.inHours);
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$hours:$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedIndex = _selectedIndex();
    final theme = Theme.of(context);
    final countdownState = ref.watch(countdownProvider);

    return Scaffold(
      body: Column(
        children: [
          // ── Global Countdown Banner ──────────────────────────────
          if (countdownState.isActive)
            Container(
              color: const Color(0xFFC62828).withOpacity(0.9), // Deep Red
              width: double.infinity,
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 8,
                bottom: 12,
              ),
              child: Column(
                children: [
                  const Text(
                    'SHIFT ENDS IN',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatDuration(countdownState.remainingDuration),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            ),
          
          // ── Main Content ──────────────────────────────────────────
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          height: 80,
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          decoration: BoxDecoration(
            color: const Color(0xFF262628), // Dark Grey surface
            borderRadius: BorderRadius.circular(40),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: List.generate(_tabs.length, (index) {
              final tab = _tabs[index];
              final isSelected = index == selectedIndex;
              return GestureDetector(
                onTap: () {
                  if (tab.path != currentPath) {
                    context.go(tab.path);
                  }
                },
                behavior: HitTestBehavior.opaque,
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSelected ? const Color(0xFFFF735D) : Colors.transparent,
                  ),
                  child: Icon(
                    isSelected ? tab.selectedIcon : tab.icon,
                    color: isSelected ? Colors.black : Colors.grey.shade500,
                    size: 28,
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

/// Internal data class for tab configuration.
class _TabItem {
  const _TabItem({
    required this.path,
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });

  final String path;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
}
