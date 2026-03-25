import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/auth_repository.dart';
import '../data/dtos/login_request_dto.dart';
import '../providers/auth_provider.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _emailError;
  String? _passwordError;
  String? _globalError;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  bool _validate() {
    String? emailErr;
    String? passErr;

    final email = _emailController.text.trim();
    if (email.isEmpty) {
      emailErr = 'Informe seu e-mail';
    } else if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(email)) {
      emailErr = 'E-mail inválido';
    }

    if (_passwordController.text.isEmpty) {
      passErr = 'Informe sua senha';
    }

    setState(() {
      _emailError = emailErr;
      _passwordError = passErr;
    });

    return emailErr == null && passErr == null;
  }

  Future<void> _submit() async {
    if (!_validate()) return;

    setState(() {
      _isLoading = true;
      _globalError = null;
    });

    try {
      final token = await ref.read(authRepositoryProvider).login(
        LoginRequestDto(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        ),
      );
      await ref.read(authNotifierProvider.notifier).onLoginSuccess(
        accessToken: token,
        refreshToken: '',
      );
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final message = (status == 401 || status == 400)
          ? 'E-mail ou senha incorretos.'
          : 'Erro de servidor. Tente novamente.';
      setState(() => _globalError = message);
    } catch (_) {
      setState(() => _globalError = 'Erro inesperado. Tente novamente.');
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
                  const SizedBox(height: 12),

                  // ── Theme toggle ───────────────────────────────────────────
                  const Align(
                    alignment: Alignment.centerRight,
                    child: ThemeToggleButton(),
                  ),
                  const SizedBox(height: 24),

                  // ── Logo ──────────────────────────────────────────────────
                  const Center(child: AppLogo(size: 64)),
                  const SizedBox(height: 12),
                  Center(
                    child: Text(
                      'FinanceControl',
                      style: AppTextStyles.h3(t.txtPrimary)
                          .copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(height: 52),

                  // ── Heading ────────────────────────────────────────────────
                  Text(
                    'Bem-vindo de volta 👋',
                    style: AppTextStyles.h1(t.txtPrimary),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Acesse sua conta para continuar',
                    style: AppTextStyles.body(t.txtSecondary),
                  ),
                  const SizedBox(height: 32),

                  // ── Global error ───────────────────────────────────────────
                  if (_globalError != null) ...[
                    _ErrorBanner(message: _globalError!),
                    const SizedBox(height: 16),
                  ],

                  // ── Email ──────────────────────────────────────────────────
                  AppInputField(
                    placeholder: 'Email',
                    controller: _emailController,
                    errorText: _emailError,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    onChanged: (_) => setState(() => _emailError = null),
                  ),
                  const SizedBox(height: 14),

                  // ── Password ───────────────────────────────────────────────
                  AppInputField(
                    placeholder: 'Senha',
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    errorText: _passwordError,
                    textInputAction: TextInputAction.done,
                    onSubmitted: _submit,
                    onChanged: (_) => setState(() => _passwordError = null),
                    rightIcon: GestureDetector(
                      onTap: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
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
                  const SizedBox(height: 28),

                  // ── Submit button ──────────────────────────────────────────
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
                      : PrimaryButton(label: 'Entrar', onPressed: _submit),

                  const Spacer(),

                  // ── Register link ──────────────────────────────────────────
                  Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Não tem conta? ',
                          style: AppTextStyles.body(t.txtSecondary)
                              .copyWith(fontSize: 14),
                        ),
                        GestureDetector(
                          onTap: () => context.push('/register'),
                          child: Text(
                            'Cadastre-se',
                            style: AppTextStyles.body(t.primary).copyWith(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
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

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: t.error.withValues(alpha: t.isDark ? 0.15 : 0.08),
        borderRadius: AppRadius.baseAll,
        border: Border.all(color: t.error.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: t.error, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message, style: AppTextStyles.bodySm(t.error)),
          ),
        ],
      ),
    );
  }
}
