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

  /// Anything other than 1 turns the field into a growing text area: the box
  /// loses its fixed height and the icons align to the first line.
  final int maxLines;
  final int? minLines;
  final int? maxLength;

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
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
  });

  @override
  State<AppInputField> createState() => _AppInputFieldState();
}

class _AppInputFieldState extends State<AppInputField> {
  final _focusNode = FocusNode();
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_onFocusChange);
  }

  void _onFocusChange() {
    if (_focusNode.hasFocus != _focused) {
      setState(() => _focused = _focusNode.hasFocus);
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final hasError = widget.errorText != null && widget.errorText!.isNotEmpty;
    final isMultiline = widget.maxLines != 1;
    final borderColor = hasError
        ? t.error
        : _focused
            ? t.accent
            : t.mist;
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
            height: isMultiline ? null : 48,
            padding: isMultiline
                ? const EdgeInsets.symmetric(vertical: 12)
                : EdgeInsets.zero,
            decoration: BoxDecoration(
              color: t.surfaceEl,
              borderRadius: AppRadius.baseAll,
              border: Border.all(
                color: borderColor,
                width: _focused || hasError ? 1.6 : 1.2,
              ),
              boxShadow: _focused && !hasError
                  ? [
                      BoxShadow(
                        color: t.accent.withValues(alpha: 0.12),
                        blurRadius: 0,
                        spreadRadius: 3,
                      ),
                    ]
                  : null,
            ),
            child: Row(
              crossAxisAlignment: isMultiline
                  ? CrossAxisAlignment.start
                  : CrossAxisAlignment.center,
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
                    maxLines: widget.maxLines,
                    minLines: widget.minLines,
                    maxLength: widget.maxLength,
                    keyboardType: widget.keyboardType ??
                        (isMultiline ? TextInputType.multiline : null),
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
                      counterText: '',
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
