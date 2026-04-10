import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/auth_repository.dart';

class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({super.key});

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _tokenController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _tokenError;
  String? _passwordError;
  String? _confirmError;
  String? _globalError;
  bool _isLoading = false;
  bool _success = false;

  @override
  void dispose() {
    _tokenController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final token = _tokenController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    setState(() {
      _tokenError = null;
      _passwordError = null;
      _confirmError = null;
      _globalError = null;
    });

    var hasError = false;
    if (token.isEmpty) {
      setState(() => _tokenError = 'Reset token is required.');
      hasError = true;
    }
    if (password.isEmpty) {
      setState(() => _passwordError = 'Password is required.');
      hasError = true;
    } else if (password.length < 6) {
      setState(() => _passwordError = 'Password must be at least 6 characters.');
      hasError = true;
    }
    if (confirm != password) {
      setState(() => _confirmError = 'Passwords do not match.');
      hasError = true;
    }
    if (hasError) return;

    setState(() => _isLoading = true);
    try {
      await ref.read(authRepositoryProvider).resetPassword(token, password);
      if (mounted) setState(() => _success = true);
    } on DioException catch (e) {
      setState(() {
        _globalError = e.response?.data?['message'] as String? ??
            'Invalid or expired reset token.';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Scaffold(
      body: AppBackground(
        scrollable: true,
        child: SafeArea(
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: () => context.pop(),
                  child: Icon(Icons.arrow_back_rounded,
                      color: t.txtPrimary, size: 24),
                ),
                const SizedBox(height: 32),
                Text('Reset password', style: AppTextStyles.h1(t.txtPrimary)),
                const SizedBox(height: 6),
                Text(
                  'Enter the reset token and your new password.',
                  style: AppTextStyles.body(t.txtSecondary),
                ),
                const SizedBox(height: 32),
                if (_success) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: t.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border:
                          Border.all(color: t.success.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.check_circle_outline_rounded,
                            color: t.success, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Password reset successfully!',
                            style: AppTextStyles.body(t.success)
                                .copyWith(fontSize: 14),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  PrimaryButton(
                    label: 'Go to login',
                    onPressed: () => context.go('/login'),
                  ),
                ] else ...[
                  if (_globalError != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: t.error.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(_globalError!,
                          style: AppTextStyles.body(t.error)
                              .copyWith(fontSize: 13)),
                    ),
                    const SizedBox(height: 16),
                  ],
                  AppInputField(
                    placeholder: 'Reset token',
                    controller: _tokenController,
                    errorText: _tokenError,
                    textInputAction: TextInputAction.next,
                    onChanged: (_) => setState(() => _tokenError = null),
                  ),
                  const SizedBox(height: 14),
                  AppInputField(
                    placeholder: 'New password',
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    errorText: _passwordError,
                    textInputAction: TextInputAction.next,
                    onChanged: (_) => setState(() => _passwordError = null),
                    rightIcon: GestureDetector(
                      onTap: () => setState(
                          () => _obscurePassword = !_obscurePassword),
                      child: Padding(
                        padding: const EdgeInsets.all(4),
                        child: Icon(
                          _obscurePassword
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                          size: 20,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  AppInputField(
                    placeholder: 'Confirm new password',
                    controller: _confirmController,
                    obscureText: _obscureConfirm,
                    errorText: _confirmError,
                    textInputAction: TextInputAction.done,
                    onSubmitted: _submit,
                    onChanged: (_) => setState(() => _confirmError = null),
                    rightIcon: GestureDetector(
                      onTap: () =>
                          setState(() => _obscureConfirm = !_obscureConfirm),
                      child: Padding(
                        padding: const EdgeInsets.all(4),
                        child: Icon(
                          _obscureConfirm
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                          size: 20,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  _isLoading
                      ? Center(
                          child: SizedBox(
                            height: 48,
                            child: Center(
                              child: CircularProgressIndicator(
                                color: t.primary,
                                strokeWidth: 2.5,
                              ),
                            ),
                          ),
                        )
                      : PrimaryButton(
                          label: 'Reset password',
                          onPressed: _submit,
                        ),
                ],
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
