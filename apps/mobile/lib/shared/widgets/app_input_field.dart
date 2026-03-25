import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';

class AppInputField extends StatefulWidget {
  final String? placeholder;
  final String? label;
  final Widget? rightIcon;
  final Widget? leftIcon;
  final String? errorText;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final TextCapitalization textCapitalization;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onSubmitted;
  final List<TextInputFormatter>? inputFormatters;

  const AppInputField({
    super.key,
    this.placeholder,
    this.label,
    this.rightIcon,
    this.leftIcon,
    this.errorText,
    this.controller,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.textCapitalization = TextCapitalization.none,
    this.onChanged,
    this.onSubmitted,
    this.inputFormatters,
  });

  @override
  State<AppInputField> createState() => _AppInputFieldState();
}

class _AppInputFieldState extends State<AppInputField> {
  final _focusNode = FocusNode();

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final hasError = widget.errorText != null && widget.errorText!.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: AppTextStyles.caption(t.txtSecondary)
                .copyWith(fontSize: 12, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 5),
        ],
        GestureDetector(
          onTap: () => _focusNode.requestFocus(),
          child: Container(
            height: 48,
            decoration: BoxDecoration(
              color: t.isDark
                  ? const Color(0xFF1C1830).withValues(alpha: 0.85)
                  : const Color(0xFFEDE9FE).withValues(alpha: 0.5),
              borderRadius: AppRadius.baseAll,
              border: Border.all(
                color: hasError
                    ? t.error
                    : t.isDark
                        ? Colors.white.withValues(alpha: 0.09)
                        : const Color(0xFF7C3AED).withValues(alpha: 0.18),
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                if (widget.leftIcon != null) ...[
                  const SizedBox(width: 10),
                  IconTheme(
                    data: IconThemeData(color: t.txtTertiary),
                    child: widget.leftIcon!,
                  ),
                  const SizedBox(width: 8),
                ] else
                  const SizedBox(width: 14),
                Expanded(
                  child: TextField(
                    focusNode: _focusNode,
                    controller: widget.controller,
                    obscureText: widget.obscureText,
                    keyboardType: widget.keyboardType,
                    textInputAction: widget.textInputAction,
                    textCapitalization: widget.textCapitalization,
                    inputFormatters: widget.inputFormatters,
                    onChanged: widget.onChanged,
                    onSubmitted:
                        widget.onSubmitted != null ? (_) => widget.onSubmitted!() : null,
                    style: AppTextStyles.body(t.txtPrimary).copyWith(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: widget.placeholder,
                      hintStyle:
                          AppTextStyles.body(t.txtTertiary).copyWith(fontSize: 14),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      disabledBorder: InputBorder.none,
                      errorBorder: InputBorder.none,
                      focusedErrorBorder: InputBorder.none,
                      filled: false,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ),
                if (widget.rightIcon != null) ...[
                  const SizedBox(width: 8),
                  IconTheme(
                    data: IconThemeData(color: t.txtTertiary, size: 20),
                    child: widget.rightIcon!,
                  ),
                  const SizedBox(width: 12),
                ] else
                  const SizedBox(width: 14),
              ],
            ),
          ),
        ),
        if (hasError) ...[
          const SizedBox(height: 4),
          Text(
            widget.errorText!,
            style: AppTextStyles.caption(t.error).copyWith(fontSize: 11),
          ),
        ],
      ],
    );
  }
}
