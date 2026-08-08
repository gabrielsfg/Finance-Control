import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/auth_repository.dart';

class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({required this.email, super.key});

  /// Carried over from the screen that requested the code — the API needs the
  /// address alongside it, since the code alone is only unique per user.
  final String email;

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _codeError;
  String? _passwordError;
  String? _confirmError;
  String? _globalError;
  bool _isLoading = false;
  bool _success = false;

  @override
  void dispose() {
    _codeController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final code = _codeController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    setState(() {
      _codeError = null;
      _passwordError = null;
      _confirmError = null;
      _globalError = null;
    });

    var hasError = false;
    if (code.length != 6) {
      setState(() => _codeError = 'O código tem 6 dígitos.');
      hasError = true;
    }
    // Mirrors the backend rule. Checking it here turns a 422 round trip into an
    // inline message, and a reset must not be a way around the password policy.
    if (password.isEmpty) {
      setState(() => _passwordError = 'Informe sua senha.');
      hasError = true;
    } else if (password.length < 8) {
      setState(() => _passwordError = 'A senha deve ter pelo menos 8 caracteres.');
      hasError = true;
    } else if (!RegExp(r'(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])')
        .hasMatch(password)) {
      setState(() => _passwordError =
          'Use maiúscula, minúscula, número e caractere especial.');
      hasError = true;
    }
    if (confirm != password) {
      setState(() => _confirmError = 'As senhas não coincidem.');
      hasError = true;
    }
    if (hasError) return;

    setState(() => _isLoading = true);
    try {
      await ref.read(authRepositoryProvider).resetPassword(
            email: widget.email,
            code: code,
            newPassword: password,
          );
      if (mounted) setState(() => _success = true);
    } on DioException catch (e) {
      setState(() {
        _globalError = e.response?.statusCode == 429
            ? 'Muitas tentativas. Aguarde alguns minutos.'
            : 'Código inválido ou expirado.';
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
                Text('Redefinir senha', style: AppTextStyles.h1(t.txtPrimary)),
                const SizedBox(height: 6),
                Text(
                  'Se existir uma conta para ${widget.email}, o código chegou por '
                  'e-mail. Ele vale por 15 minutos.',
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
                            'Senha redefinida. Entre com a nova senha.',
                            style: AppTextStyles.body(t.success)
                                .copyWith(fontSize: 14),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  PrimaryButton(
                    label: 'Ir para o login',
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
                    placeholder: 'Código de 6 dígitos',
                    controller: _codeController,
                    errorText: _codeError,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.next,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    onChanged: (_) => setState(() => _codeError = null),
                  ),
                  const SizedBox(height: 14),
                  AppInputField(
                    placeholder: 'Nova senha',
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
                    placeholder: 'Confirmar nova senha',
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
                          label: 'Redefinir senha',
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
