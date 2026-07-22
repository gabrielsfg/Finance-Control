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
  });
}
