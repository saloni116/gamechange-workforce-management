import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../app/router.dart';
import '../../core/theme/app_theme.dart';
import '../../features/timer/domain/countdown_provider.dart';

/// Persistent scaffold wrapper used by the ShellRoute.
///
/// Provides a premium enterprise bottom navigation with the GameChange BOS
/// brand design — clean white bar with Industrial Blue active state.
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
      path: AppRoutes.dashboard,
      icon: Icons.home_outlined,
      selectedIcon: Icons.home_rounded,
      label: 'Home',
    ),
    _TabItem(
      path: AppRoutes.history,
      icon: Icons.history_outlined,
      selectedIcon: Icons.history_rounded,
      label: 'History',
    ),
    _TabItem(
      path: AppRoutes.profile,
      icon: Icons.person_outline_rounded,
      selectedIcon: Icons.person_rounded,
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
    return 0;
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
    final countdownState = ref.watch(countdownProvider);

    return Scaffold(
      backgroundColor: AppTheme.scaffoldBg,
      body: Column(
        children: [
          // ── Global Countdown Banner ────────────────────────────────
          if (countdownState.isActive)
            Container(
              color: const Color(0xFFF97316), // Orange alert
              width: double.infinity,
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 6,
                bottom: 10,
                left: 20,
                right: 20,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.access_time_filled_rounded, color: Colors.white, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    'SHIFT ENDS IN  ',
                    style: GoogleFonts.inter(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Text(
                    _formatDuration(countdownState.remainingDuration),
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      fontFeatures: const [FontFeature.tabularFigures()],
                      letterSpacing: 1.0,
                    ),
                  ),
                ],
              ),
            ),

          // ── Main Content ───────────────────────────────────────────
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: _EnterpriseBottomNav(
        selectedIndex: selectedIndex,
        tabs: _tabs,
        currentPath: currentPath,
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Enterprise Bottom Navigation Bar
// ══════════════════════════════════════════════════════════════════════════
class _EnterpriseBottomNav extends StatelessWidget {
  const _EnterpriseBottomNav({
    required this.selectedIndex,
    required this.tabs,
    required this.currentPath,
  });

  final int selectedIndex;
  final List<_TabItem> tabs;
  final String currentPath;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.cardWhite,
        border: const Border(
          top: BorderSide(color: AppTheme.borderColor, width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: List.generate(tabs.length, (i) {
              final tab = tabs[i];
              final isSelected = selectedIndex == i;
              return Expanded(
                child: _NavBarItem(
                  tab: tab,
                  isSelected: isSelected,
                  onTap: () {
                    if (tab.path != currentPath) {
                      context.go(tab.path);
                    }
                  },
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Individual Nav Bar Item with Animation
// ══════════════════════════════════════════════════════════════════════════
class _NavBarItem extends StatefulWidget {
  const _NavBarItem({
    required this.tab,
    required this.isSelected,
    required this.onTap,
  });

  final _TabItem tab;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  State<_NavBarItem> createState() => _NavBarItemState();
}

class _NavBarItemState extends State<_NavBarItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 220),
    );
    _scaleAnim = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.18)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.18, end: 1.0)
            .chain(CurveTween(curve: Curves.easeIn)),
        weight: 50,
      ),
    ]).animate(_controller);

    if (widget.isSelected) _controller.forward();
  }

  @override
  void didUpdateWidget(covariant _NavBarItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected && !oldWidget.isSelected) {
      _controller.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        widget.onTap();
        _controller.forward(from: 0.0);
      },
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ScaleTransition(
            scale: _scaleAnim,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 46,
              height: 34,
              decoration: BoxDecoration(
                color: widget.isSelected
                    ? AppTheme.industrialBlue.withOpacity(0.12)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                widget.isSelected ? widget.tab.selectedIcon : widget.tab.icon,
                color: widget.isSelected
                    ? AppTheme.industrialBlue
                    : AppTheme.textSecondary,
                size: 24,
              ),
            ),
          ),
          const SizedBox(height: 3),
          AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 200),
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight:
                  widget.isSelected ? FontWeight.w600 : FontWeight.w400,
              color: widget.isSelected
                  ? AppTheme.industrialBlue
                  : AppTheme.textSecondary,
            ),
            child: Text(widget.tab.label),
          ),
        ],
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
