import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../data/mock_data.dart';
import '../domain/daily_report_notifier.dart';
import '../../../core/theme/app_theme.dart';

/// Coworker presence section of the Daily Report form.
///
/// Contains:
/// - A checkbox to toggle coworker mode. When checked, prompts for verification.
/// - A green confirmation card on successful verification.
///
/// All state is read from [dailyReportProvider]; mutations flow through
/// the notifier — this widget is presentation-only.
class CoworkerSection extends ConsumerStatefulWidget {
  const CoworkerSection({super.key});

  @override
  ConsumerState<CoworkerSection> createState() => _CoworkerSectionState();
}

class _CoworkerSectionState extends ConsumerState<CoworkerSection> {
  Future<void> _showCoworkerVerifyDialog(BuildContext context) async {
    final notifier = ref.read(dailyReportProvider.notifier);
    final theme = Theme.of(context);
    final controller = TextEditingController();
    String? errorMessage;

    final result = await showDialog<Coworker?>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: AppTheme.cardWhite,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: AppTheme.borderColor),
              ),
              title: Row(
                children: [
                  const Icon(Icons.people_outline, color: AppTheme.industrialBlue),
                  const SizedBox(width: 10),
                  Text(
                    'Verify Coworker',
                    style: GoogleFonts.inter(
                      color: AppTheme.textPrimary,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Please enter the Employee ID of the coworker working with you.',
                    style: GoogleFonts.inter(
                      color: AppTheme.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: controller,
                    autofocus: true,
                    style: GoogleFonts.inter(
                      color: AppTheme.textPrimary,
                      fontSize: 14,
                    ),
                    decoration: InputDecoration(
                      labelText: 'Employee ID',
                      hintText: 'e.g. EMP-1042',
                      errorText: errorMessage,
                      focusedBorder: OutlineInputBorder(
                        borderSide: const BorderSide(color: AppTheme.industrialBlue, width: 2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderSide: const BorderSide(color: AppTheme.borderColor, width: 1.5),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      errorBorder: OutlineInputBorder(
                        borderSide: const BorderSide(color: AppTheme.errorRed),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      focusedErrorBorder: OutlineInputBorder(
                        borderSide: const BorderSide(color: AppTheme.errorRed),
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    textCapitalization: TextCapitalization.characters,
                    onChanged: (_) {
                      if (errorMessage != null) {
                        setState(() {
                          errorMessage = null;
                        });
                      }
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(null),
                  child: Text(
                    'Cancel',
                    style: GoogleFonts.inter(color: AppTheme.textSecondary),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.industrialBlue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  onPressed: () {
                    final idInput = controller.text.trim().toUpperCase();
                    if (idInput.isEmpty) {
                      setState(() {
                        errorMessage = 'Employee ID cannot be empty.';
                      });
                      return;
                    }
                    // Lookup in directory
                    final match = mockCoworkerDirectory.cast<Coworker?>().firstWhere(
                      (c) => c!.employeeId.toUpperCase() == idInput,
                      orElse: () => null,
                    );
                    if (match != null) {
                      Navigator.of(context).pop(match);
                    } else {
                      setState(() {
                        errorMessage = 'Employee does not exist';
                      });
                    }
                  },
                  child: const Text('Verify'),
                ),
              ],
            );
          },
        );
      },
    );

    if (result != null) {
      notifier.setVerifiedCoworkerDirectly(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(dailyReportProvider);
    final notifier = ref.read(dailyReportProvider.notifier);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.symmetric(vertical: 4),
          decoration: BoxDecoration(
            color: AppTheme.cardWhite,
            borderRadius: BorderRadius.circular(12),
            border: const Border.fromBorderSide(
              BorderSide(color: AppTheme.borderColor, width: 1),
            ),
          ),
          child: CheckboxListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            activeColor: AppTheme.industrialBlue,
            title: Text(
              'Coworker Present?',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppTheme.textPrimary,
              ),
            ),
            value: state.hasCoworker,
            onChanged: (v) {
              if (v == true) {
                _showCoworkerVerifyDialog(context);
              } else {
                notifier.clearCoworker();
              }
            },
            controlAffinity: ListTileControlAffinity.leading,
            dense: true,
          ),
        ),

        // ── Success card ──────────────────────────────────────────────
        if (state.hasCoworker && state.verifiedCoworker != null) ...[
          const SizedBox(height: 12),
          _VerifiedCoworkerCard(
            name: state.verifiedCoworker!.name,
            employeeId: state.verifiedCoworker!.employeeId,
            department: state.verifiedCoworker!.department,
          ),
        ],
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Private helper widget
// ──────────────────────────────────────────────────────────────────────────

/// Green confirmation card shown after a coworker has been successfully
/// verified.
class _VerifiedCoworkerCard extends StatelessWidget {
  const _VerifiedCoworkerCard({
    required this.name,
    required this.employeeId,
    required this.department,
  });

  final String name;
  final String employeeId;
  final String department;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.emeraldGreen.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.emeraldGreen.withOpacity(0.3), width: 1),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: AppTheme.emeraldGreen, size: 32),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.emeraldGreen,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$employeeId  ·  $department',
                  style: GoogleFonts.inter(
                    color: AppTheme.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.emeraldGreen.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Credit Shared',
              style: GoogleFonts.inter(
                color: AppTheme.emeraldGreen,
                fontWeight: FontWeight.w600,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
