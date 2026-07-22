import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/auth_repository.dart';

class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _emailController = TextEditingController();
  String? _emailError;
  String? _globalError;
  bool _isLoading = false;
  bool _sent = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();

    setState(() {
      _emailError = null;
      _globalError = null;
    });

    if (email.isEmpty) {
      setState(() => _emailError = 'Informe seu e-mail.');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(authRepositoryProvider).forgotPassword(email);
      if (mounted) setState(() => _sent = true);
    } on DioException catch (e) {
      setState(() {
        _globalError =
            e.response?.data?['message'] as String? ?? 'Algo deu errado.';
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
        scrollable: false,
        child: SizedBox.expand(
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
                  Text('Recuperar senha',
                      style: AppTextStyles.h1(t.txtPrimary)),
                  const SizedBox(height: 6),
                  Text(
                    'Informe seu e-mail e enviaremos um link para redefinir a senha.',
                    style: AppTextStyles.body(t.txtSecondary),
                  ),
                  const SizedBox(height: 32),
                  if (_sent) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: t.success.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: t.success.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.check_circle_outline_rounded,
                              color: t.success, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Se esse e-mail existir, enviamos um link de redefinição.',
                              style: AppTextStyles.body(t.success)
                                  .copyWith(fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    PrimaryButton(
                      label: 'Continuar para redefinir',
                      onPressed: () => context.push('/reset-password'),
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
                      placeholder: 'E-mail',
                      controller: _emailController,
                      errorText: _emailError,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.done,
                      onChanged: (_) => setState(() => _emailError = null),
                      onSubmitted: _submit,
                    ),
                    const SizedBox(height: 24),
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
                            label: 'Enviar link de redefinição',
                            onPressed: _submit,
                          ),
                  ],
                  const Spacer(),
                  Center(
                    child: GestureDetector(
                      onTap: () => context.pop(),
                      child: Text(
                        'Voltar para o login',
                        style: AppTextStyles.body(t.accent).copyWith(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
