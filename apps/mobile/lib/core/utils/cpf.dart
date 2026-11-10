import 'package:flutter/services.dart';

/// Brazilian CPF: the digits only, without the mask.
String cpfDigits(String value) => value.replaceAll(RegExp(r'\D'), '');

/// Checks the two verifier digits, the same rule the API applies.
bool isValidCpf(String value) {
  final digits = cpfDigits(value);
  if (digits.length != 11) return false;

  // 000.000.000-00, 111.111.111-11... pass the digit check but are not real CPFs.
  if (digits.split('').toSet().length == 1) return false;

  int verifier(int length) {
    var sum = 0;
    for (var i = 0; i < length; i++) {
      sum += int.parse(digits[i]) * (length + 1 - i);
    }
    final remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  return int.parse(digits[9]) == verifier(9) &&
      int.parse(digits[10]) == verifier(10);
}

/// Masks the input as 000.000.000-00 while typing, keeping at most 11 digits.
class CpfInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = cpfDigits(newValue.text);
    final capped = digits.length > 11 ? digits.substring(0, 11) : digits;

    final buffer = StringBuffer();
    for (var i = 0; i < capped.length; i++) {
      if (i == 3 || i == 6) buffer.write('.');
      if (i == 9) buffer.write('-');
      buffer.write(capped[i]);
    }

    final text = buffer.toString();
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}
