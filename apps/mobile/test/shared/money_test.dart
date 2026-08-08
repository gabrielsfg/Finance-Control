import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_control_front/core/utils/app_locale.dart';
import 'package:finance_control_front/shared/widgets/money.dart';

Widget _wrap(Widget child) => MaterialApp(
      home: AppLocaleScope(
        locale: AppLocale.defaultLocale, // pt-BR / R$
        child: Scaffold(body: Center(child: child)),
      ),
    );

String _plainTextOf(WidgetTester tester) {
  final richText = tester.widget<RichText>(find.byType(RichText).first);
  return richText.text.toPlainText();
}

void main() {
  group('Money', () {
    testWidgets('renders symbol, grouped integer and cents (pt-BR)',
        (tester) async {
      await tester.pumpWidget(_wrap(const Money(123456)));
      final text = _plainTextOf(tester);
      expect(text.contains(r'R$'), isTrue);
      expect(text.contains('1.234'), isTrue);
      expect(text.contains(',56'), isTrue);
    });

    testWidgets('signed positive shows a plus prefix', (tester) async {
      await tester.pumpWidget(_wrap(const Money(5000, signed: true)));
      expect(_plainTextOf(tester).contains('+'), isTrue);
    });

    testWidgets('negative shows a minus prefix', (tester) async {
      await tester.pumpWidget(_wrap(const Money(-5000, signed: true)));
      final text = _plainTextOf(tester);
      expect(text.contains('−'), isTrue); // U+2212 minus
      expect(text.contains('50,00'), isTrue);
    });

    testWidgets('animate: false renders the final figure immediately',
        (tester) async {
      await tester.pumpWidget(_wrap(const Money(100000)));
      expect(_plainTextOf(tester).contains('1.000'), isTrue);
    });

    testWidgets('animate: true counts up from zero on mount', (tester) async {
      await tester.pumpWidget(_wrap(const Money(100000, animate: true)));

      // First frame starts at zero, not at the target.
      expect(_plainTextOf(tester).contains('1.000'), isFalse);

      // Mid-flight it shows something between the two.
      await tester.pump(const Duration(milliseconds: 300));
      final midway = _plainTextOf(tester);
      expect(midway.contains('1.000'), isFalse);
      expect(midway, isNot(equals(r'R$0,00')));

      // And it settles exactly on the target.
      await tester.pumpAndSettle();
      expect(_plainTextOf(tester).contains('1.000'), isTrue);
    });

    testWidgets('animate: true travels to a new value when cents change',
        (tester) async {
      await tester.pumpWidget(_wrap(const Money(100000, animate: true)));
      await tester.pumpAndSettle();

      await tester.pumpWidget(_wrap(const Money(500000, animate: true)));
      await tester.pump(const Duration(milliseconds: 200));
      final midway = _plainTextOf(tester);
      expect(midway.contains('5.000'), isFalse); // still on the way
      expect(midway.contains('1.000'), isFalse); // and already moved off

      await tester.pumpAndSettle();
      expect(_plainTextOf(tester).contains('5.000'), isTrue);
    });

    testWidgets('animate: true keeps the target sign while counting',
        (tester) async {
      await tester.pumpWidget(_wrap(const Money(-100000, animate: true)));
      // The minus belongs to the target, so it must not flicker in mid-count.
      expect(_plainTextOf(tester).contains('−'), isTrue);
      await tester.pump(const Duration(milliseconds: 300));
      expect(_plainTextOf(tester).contains('−'), isTrue);
      await tester.pumpAndSettle();
      expect(_plainTextOf(tester).contains('−'), isTrue);
    });
  });
}
