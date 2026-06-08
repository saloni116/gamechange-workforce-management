import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// App-wide theme configuration — GameChange BOS Enterprise Light Theme.
///
/// Design System:
/// - Primary: Deep Navy #0F172A
/// - Secondary: Industrial Blue #2563EB
/// - Success/Accent: Emerald #10B981
/// - Teal Accent: #14B8A6
/// - Background: Off-white #F8FAFC
/// - Cards: Pure white with soft shadows
/// - Rounded: 12–16px
class AppTheme {
  AppTheme._();

  // ─── Brand Colors ────────────────────────────────────────────────────
  static const Color primaryNavy = Color(0xFF0F172A);       // Deep Navy
  static const Color industrialBlue = Color(0xFF2563EB);    // Industrial Blue
  static const Color emeraldGreen = Color(0xFF10B981);      // Success/Emerald
  static const Color tealAccent = Color(0xFF14B8A6);        // Teal
  static const Color coralOrange = Color(0xFFF97316);       // Warning/Rework
  static const Color errorRed = Color(0xFFEF4444);          // Error

  // ─── Backgrounds & Surfaces ──────────────────────────────────────────
  static const Color scaffoldBg = Color(0xFFF8FAFC);        // Off-white
  static const Color cardWhite = Color(0xFFFFFFFF);         // White cards
  static const Color surfaceGrey = Color(0xFFF1F5F9);       // Light grey surface
  static const Color borderColor = Color(0xFFE2E8F0);       // Subtle border

  // ─── Text Colors ─────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF0F172A);       // Deep navy text
  static const Color textSecondary = Color(0xFF64748B);     // Muted slate
  static const Color textHint = Color(0xFF94A3B8);          // Hint/placeholder

  // ─── Color Scheme ────────────────────────────────────────────────────
  static final ColorScheme _colorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: industrialBlue,
    onPrimary: Colors.white,
    primaryContainer: const Color(0xFFDBEAFE),
    onPrimaryContainer: const Color(0xFF1E3A8A),
    secondary: tealAccent,
    onSecondary: Colors.white,
    secondaryContainer: const Color(0xFFCCFBF1),
    onSecondaryContainer: const Color(0xFF134E4A),
    tertiary: emeraldGreen,
    onTertiary: Colors.white,
    tertiaryContainer: const Color(0xFFD1FAE5),
    onTertiaryContainer: const Color(0xFF064E3B),
    error: errorRed,
    onError: Colors.white,
    errorContainer: const Color(0xFFFEE2E2),
    onErrorContainer: const Color(0xFF7F1D1D),
    surface: cardWhite,
    onSurface: textPrimary,
    surfaceContainerHighest: surfaceGrey,
    onSurfaceVariant: textSecondary,
    outline: borderColor,
    outlineVariant: const Color(0xFFF1F5F9),
    shadow: Colors.black,
    scrim: Colors.black54,
    inverseSurface: primaryNavy,
    onInverseSurface: Colors.white,
    inversePrimary: const Color(0xFF93C5FD),
    surfaceTint: industrialBlue,
  );

  // ─── Light Theme Data ─────────────────────────────────────────────────
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: _colorScheme,
      scaffoldBackgroundColor: scaffoldBg,

      // ── Typography ──────────────────────────────────────────────────
      textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme).copyWith(
        displayLarge: GoogleFonts.inter(
          fontSize: 57, fontWeight: FontWeight.w700, color: textPrimary,
          letterSpacing: -1.0,
        ),
        displayMedium: GoogleFonts.inter(
          fontSize: 45, fontWeight: FontWeight.w700, color: textPrimary,
          letterSpacing: -0.5,
        ),
        headlineLarge: GoogleFonts.inter(
          fontSize: 32, fontWeight: FontWeight.w700, color: textPrimary,
          letterSpacing: -0.5,
        ),
        headlineMedium: GoogleFonts.inter(
          fontSize: 28, fontWeight: FontWeight.w700, color: textPrimary,
        ),
        headlineSmall: GoogleFonts.inter(
          fontSize: 24, fontWeight: FontWeight.w600, color: textPrimary,
        ),
        titleLarge: GoogleFonts.inter(
          fontSize: 22, fontWeight: FontWeight.w700, color: textPrimary,
          letterSpacing: -0.2,
        ),
        titleMedium: GoogleFonts.inter(
          fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary,
          letterSpacing: 0.1,
        ),
        titleSmall: GoogleFonts.inter(
          fontSize: 14, fontWeight: FontWeight.w600, color: textPrimary,
          letterSpacing: 0.1,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16, fontWeight: FontWeight.w400, color: textPrimary,
          letterSpacing: 0.15,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14, fontWeight: FontWeight.w400, color: textSecondary,
          letterSpacing: 0.25,
        ),
        bodySmall: GoogleFonts.inter(
          fontSize: 12, fontWeight: FontWeight.w400, color: textSecondary,
          letterSpacing: 0.4,
        ),
        labelLarge: GoogleFonts.inter(
          fontSize: 14, fontWeight: FontWeight.w600, color: textPrimary,
          letterSpacing: 0.1,
        ),
        labelMedium: GoogleFonts.inter(
          fontSize: 12, fontWeight: FontWeight.w500, color: textSecondary,
          letterSpacing: 0.5,
        ),
        labelSmall: GoogleFonts.inter(
          fontSize: 11, fontWeight: FontWeight.w500, color: textSecondary,
          letterSpacing: 0.5,
        ),
      ),

      // ── AppBar ──────────────────────────────────────────────────────
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        backgroundColor: cardWhite,
        foregroundColor: textPrimary,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black.withOpacity(0.05),
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: textPrimary,
          letterSpacing: -0.3,
        ),
        iconTheme: const IconThemeData(color: textPrimary, size: 22),
      ),

      // ── Card ────────────────────────────────────────────────────────
      cardTheme: CardThemeData(
        elevation: 0,
        margin: const EdgeInsets.symmetric(horizontal: 0, vertical: 6),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderColor, width: 1),
        ),
        clipBehavior: Clip.antiAlias,
        color: cardWhite,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black.withOpacity(0.08),
      ),

      // ── Input Decoration ─────────────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceGrey,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderColor, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderColor, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: industrialBlue, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: errorRed, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: errorRed, width: 2),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderColor, width: 1),
        ),
        hintStyle: GoogleFonts.inter(
          color: textHint,
          fontSize: 14,
          fontWeight: FontWeight.w400,
        ),
        labelStyle: GoogleFonts.inter(
          color: textSecondary,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        floatingLabelStyle: GoogleFonts.inter(
          color: industrialBlue,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
        prefixIconColor: textSecondary,
        suffixIconColor: textSecondary,
        errorStyle: GoogleFonts.inter(
          color: errorRed,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),

      // ── Elevated Button ──────────────────────────────────────────────
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: industrialBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
        ),
      ),

      // ── Outlined Button ──────────────────────────────────────────────
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: industrialBlue,
          side: const BorderSide(color: industrialBlue, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ── Text Button ──────────────────────────────────────────────────
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: industrialBlue,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ── Chip ─────────────────────────────────────────────────────────
      chipTheme: ChipThemeData(
        backgroundColor: surfaceGrey,
        selectedColor: industrialBlue,
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
        secondaryLabelStyle: GoogleFonts.inter(
          fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: const StadiumBorder(),
        side: const BorderSide(color: borderColor, width: 1),
        checkmarkColor: Colors.white,
      ),

      // ── Navigation Bar ───────────────────────────────────────────────
      navigationBarTheme: NavigationBarThemeData(
        elevation: 0,
        height: 70,
        backgroundColor: cardWhite,
        indicatorColor: Colors.transparent,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysHide,
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: industrialBlue, size: 26);
          }
          return const IconThemeData(color: textSecondary, size: 26);
        }),
      ),

      // ── Divider ──────────────────────────────────────────────────────
      dividerTheme: const DividerThemeData(
        color: borderColor,
        thickness: 1,
        space: 1,
      ),

      // ── Bottom Sheet ─────────────────────────────────────────────────
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: cardWhite,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),

      // ── Floating Action Button ────────────────────────────────────────
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: industrialBlue,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: CircleBorder(),
      ),

      // ── Progress Indicator ───────────────────────────────────────────
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: industrialBlue,
        linearTrackColor: borderColor,
      ),
    );
  }

  // ─── Dark Theme (kept for system preference support) ─────────────────
  static ThemeData get darkTheme => lightTheme;
}
