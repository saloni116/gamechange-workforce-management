import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/daily_report_notifier.dart';

/// Coworker presence section of the Daily Report form.
///
/// Contains:
/// - A checkbox to toggle coworker mode.
/// - When enabled: an Employee ID text field and a Verify button.
/// - A green confirmation card on successful verification.
/// - Red error text on verification failure.
///
/// All state is read from [dailyReportProvider]; mutations flow through
/// the notifier — this widget is presentation-only.
class CoworkerSection extends ConsumerStatefulWidget {
  const CoworkerSection({super.key});

  @override
  ConsumerState<CoworkerSection> createState() => _CoworkerSectionState();
}

class _CoworkerSectionState extends ConsumerState<CoworkerSection> {
  late final TextEditingController _idController;

  @override
  void initState() {
    super.initState();
    final initial = ref.read(dailyReportProvider).coworkerIdInput;
    _idController = TextEditingController(text: initial);
  }

  @override
  void dispose() {
    _idController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(dailyReportProvider);
    final notifier = ref.read(dailyReportProvider.notifier);
    final theme = Theme.of(context);

    // Keep controller in sync with state (e.g. when state is reset externally).
    if (_idController.text != state.coworkerIdInput) {
      _idController.text = state.coworkerIdInput;
      _idController.selection = TextSelection.fromPosition(
        TextPosition(offset: _idController.text.length),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Toggle ──────────────────────────────────────────────────────
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Coworker Present?'),
          value: state.hasCoworker,
          onChanged: (v) => notifier.toggleCoworker(v ?? false),
          controlAffinity: ListTileControlAffinity.leading,
          dense: true,
        ),

        // ── ID field + Verify ───────────────────────────────────────────
        if (state.hasCoworker) ...[
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: _idController,
                  decoration: const InputDecoration(
                    labelText: 'Employee ID',
                    hintText: 'e.g. EMP-1042',
                  ),
                  textCapitalization: TextCapitalization.characters,
                  onChanged: notifier.setCoworkerId,
                ),
              ),
              const SizedBox(width: 12),
              SizedBox(
                height: 48,
                child: FilledButton.tonal(
                  onPressed: state.isVerifyingCoworker
                      ? null
                      : () => notifier.verifyCoworker(),
                  child: state.isVerifyingCoworker
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Verify'),
                ),
              ),
            ],
          ),

          // ── Error text ────────────────────────────────────────────────
          if (state.coworkerError != null) ...[
            const SizedBox(height: 8),
            Text(
              state.coworkerError!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.error,
              ),
            ),
          ],

          // ── Success card ──────────────────────────────────────────────
          if (state.verifiedCoworker != null) ...[
            const SizedBox(height: 12),
            _VerifiedCoworkerCard(
              name: state.verifiedCoworker!.name,
              employeeId: state.verifiedCoworker!.employeeId,
              department: state.verifiedCoworker!.department,
            ),
          ],
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
    final theme = Theme.of(context);
    const successGreen = Color(0xFF2E7D32);

    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: successGreen, width: 1),
      ),
      color: const Color(0xFFE8F5E9), // light green background
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            const Icon(Icons.check_circle, color: successGreen, size: 32),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: successGreen,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$employeeId  ·  $department',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.grey.shade700,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: successGreen.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Credit Shared',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: successGreen,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
