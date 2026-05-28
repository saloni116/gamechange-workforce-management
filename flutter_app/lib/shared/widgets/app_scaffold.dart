import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router.dart';

/// Persistent scaffold wrapper used by the ShellRoute.
///
/// Provides a bottom [NavigationBar] with 3 tabs:
/// - Daily Log (/report)
/// - History   (/history)
/// - Profile   (/profile)
///
/// The [child] widget is provided by GoRouter's ShellRoute.
class AppScaffold extends StatelessWidget {
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
      path: AppRoutes.report,
      icon: Icons.edit_note_outlined,
      selectedIcon: Icons.edit_note,
      label: 'Daily Log',
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
      if (currentPath == _tabs[i].path) return i;
    }
    return 0; // Default to Daily Log
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _selectedIndex();

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: (index) {
          final targetPath = _tabs[index].path;
          // Only navigate if we're not already on the target tab.
          if (targetPath != currentPath) {
            context.go(targetPath);
          }
        },
        destinations: _tabs
            .map(
              (tab) => NavigationDestination(
                icon: Icon(tab.icon),
                selectedIcon: Icon(tab.selectedIcon),
                label: tab.label,
              ),
            )
            .toList(),
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
