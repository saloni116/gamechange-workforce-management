import 'package:flutter_test/flutter_test.dart';

import 'package:workforce_app/main.dart';

void main() {
  testWidgets('App renders with bottom navigation', (WidgetTester tester) async {
    await tester.pumpWidget(
      const WorkforceApp(),
    );
    await tester.pumpAndSettle();

    // Verify bottom navigation tabs are present.
    expect(find.text('Daily Log'), findsOneWidget);
    expect(find.text('History'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
  });
}
