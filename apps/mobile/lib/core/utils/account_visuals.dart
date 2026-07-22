import 'package:flutter/widgets.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// Icon for each account type ("Checking" | "Savings" | "Credit" | "Cash" |
/// "Debit"). Keeps the accounts list/detail visually distinct per type.
IconData accountTypeIcon(String type) {
  switch (type) {
    case 'Credit':
      return LucideIcons.creditCard;
    case 'Savings':
      return LucideIcons.piggyBank;
    case 'Cash':
      return LucideIcons.banknote;
    case 'Checking':
    case 'Debit':
    default:
      return LucideIcons.wallet;
  }
}

/// Portuguese label for each account type.
String accountTypeLabel(String type) {
  switch (type) {
    case 'Credit':
      return 'Cartão de crédito';
    case 'Savings':
      return 'Poupança';
    case 'Cash':
      return 'Dinheiro';
    case 'Checking':
      return 'Conta corrente';
    case 'Debit':
      return 'Débito';
    default:
      return type;
  }
}
