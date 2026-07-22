import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:dio/dio.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/auth_repository.dart';
import '../data/dtos/login_request_dto.dart';
import '../data/dtos/register_request_dto.dart';
import '../providers/auth_provider.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String? _nameError;
  String? _emailError;
  String? _passwordError;
  String? _confirmPasswordError;
  String? _globalError;
  String _passwordValue = '';

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  static String? _validatePasswordStrength(String password) {
    if (password.length < 8) return 'Mínimo 8 caracteres';
    if (!RegExp(r'[A-Z]').hasMatch(password)) return 'Inclua ao menos uma letra maiúscula';
    if (!RegExp(r'[a-z]').hasMatch(password)) return 'Inclua ao menos uma letra minúscula';
    if (!RegExp(r'[0-9]').hasMatch(password)) return 'Inclua ao menos um número';
    if (!RegExp(r'[!@#\$%^&*(),.?":{}|<>]').hasMatch(password)) {
      return 'Inclua ao menos um caractere especial';
    }
    return null;
  }

  bool _validate() {
    String? nameErr;
    String? emailErr;
    String? passErr;
    String? confirmErr;

    final name = _nameController.text.trim();
    if (name.isEmpty) {
      nameErr = 'Informe seu nome';
    } else if (name.length < 2) {
      nameErr = 'Nome muito curto';
    }

    final email = _emailController.text.trim();
    if (email.isEmpty) {
      emailErr = 'Informe seu e-mail';
    } else if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(email)) {
      emailErr = 'E-mail inválido';
    }

    if (_passwordController.text.isEmpty) {
      passErr = 'Informe uma senha';
    } else {
      passErr = _validatePasswordStrength(_passwordController.text);
    }

    if (_confirmPasswordController.text.isEmpty) {
      confirmErr = 'Confirme sua senha';
    } else if (_confirmPasswordController.text != _passwordController.text) {
      confirmErr = 'As senhas não coincidem';
    }

    setState(() {
      _nameError = nameErr;
      _emailError = emailErr;
      _passwordError = passErr;
      _confirmPasswordError = confirmErr;
    });

    return nameErr == null &&
        emailErr == null &&
        passErr == null &&
        confirmErr == null;
  }

  Future<void> _submit() async {
    if (!_validate()) return;

    setState(() {
      _isLoading = true;
      _globalError = null;
    });

    try {
      final repo = ref.read(authRepositoryProvider);
      final email = _emailController.text.trim();
      final password = _passwordController.text;

      await repo.register(RegisterRequestDto(
        name: _nameController.text.trim(),
        email: email,
        password: password,
      ));

      final authResponse = await repo.login(LoginRequestDto(
        email: email,
        password: password,
      ));

      await ref.read(authNotifierProvider.notifier).onLoginSuccess(
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      );
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final message = status == 429
          ? 'Muitas tentativas. Aguarde alguns minutos.'
          : status == 400
              ? 'E-mail já cadastrado.'
              : 'Não foi possível criar a conta. Tente novamente.';
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
        scrollable: true,
        child: SafeArea(
          child: Padding(
            padding: AppSpacing.screenPadding.copyWith(top: 0, bottom: 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),

                // ── Header ─────────────────────────────────────────────────
                Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Container(
                        width: 36,
                        height: 36,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: t.surfaceEl.withValues(
                              alpha: t.isDark ? 0.4 : 0.6),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.arrow_back_ios_new,
                          size: 16,
                          color: t.txtPrimary,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'Criar conta',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.h2(t.txtPrimary),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // ── Heading ────────────────────────────────────────────────
                Text(
                  'Comece agora 🚀',
                  style: AppTextStyles.h1(t.txtPrimary),
                ),
                const SizedBox(height: 6),
                Text(
                  'Crie sua conta e assuma o controle das suas finanças',
                  style: AppTextStyles.body(t.txtSecondary),
                ),
                const SizedBox(height: 32),

                // ── Global error ───────────────────────────────────────────
                if (_globalError != null) ...[
                  _ErrorBanner(message: _globalError!),
                  const SizedBox(height: 16),
                ],

                // ── Full name ──────────────────────────────────────────────
                AppInputField(
                  placeholder: 'Nome completo',
                  controller: _nameController,
                  errorText: _nameError,
                  keyboardType: TextInputType.name,
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                  onChanged: (_) => setState(() => _nameError = null),
                ),
                const SizedBox(height: 14),

                // ── Email ──────────────────────────────────────────────────
                AppInputField(
                  placeholder: 'E-mail',
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
                  textInputAction: TextInputAction.next,
                  onChanged: (v) => setState(() {
                    _passwordError = null;
                    _passwordValue = v;
                  }),
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
                if (_passwordValue.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _PasswordStrengthIndicator(password: _passwordValue),
                ],
                const SizedBox(height: 14),

                // ── Confirm password ───────────────────────────────────────
                AppInputField(
                  placeholder: 'Confirmar senha',
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirmPassword,
                  errorText: _confirmPasswordError,
                  textInputAction: TextInputAction.done,
                  onSubmitted: _submit,
                  onChanged: (_) =>
                      setState(() => _confirmPasswordError = null),
                  rightIcon: GestureDetector(
                    onTap: () => setState(
                      () => _obscureConfirmPassword = !_obscureConfirmPassword,
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Icon(
                        _obscureConfirmPassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                        size: 20,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),

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
                    : PrimaryButton(
                        label: 'Criar conta',
                        onPressed: _submit,
                      ),
                const SizedBox(height: 24),

                // ── Login link ─────────────────────────────────────────────
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Já tem conta? ',
                        style: AppTextStyles.body(t.txtSecondary)
                            .copyWith(fontSize: 14),
                      ),
                      GestureDetector(
                        onTap: () => context.pop(),
                        child: Text(
                          'Entrar',
                          style: AppTextStyles.body(t.accent).copyWith(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Password Strength Indicator ───────────────────────────────────────────────

enum _PasswordStrength { weak, medium, strong }

_PasswordStrength _calcStrength(String password) {
  int score = 0;
  if (password.length >= 8) score++;
  if (RegExp(r'[A-Z]').hasMatch(password)) score++;
  if (RegExp(r'[a-z]').hasMatch(password)) score++;
  if (RegExp(r'[0-9]').hasMatch(password)) score++;
  if (RegExp(r'[!@#\$%^&*(),.?":{}|<>]').hasMatch(password)) score++;
  if (score <= 2) return _PasswordStrength.weak;
  if (score <= 4) return _PasswordStrength.medium;
  return _PasswordStrength.strong;
}

class _PasswordStrengthIndicator extends StatelessWidget {
  const _PasswordStrengthIndicator({required this.password});

  final String password;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final strength = _calcStrength(password);

    final (filledSegments, color, label) = switch (strength) {
      _PasswordStrength.weak   => (1, t.clay, 'Fraca'),
      _PasswordStrength.medium => (2, t.gold, 'Média'),
      _PasswordStrength.strong => (3, t.moss, 'Forte'),
    };

    return Row(
      children: [
        ...List.generate(3, (i) {
          final filled = i < filledSegments;
          return Expanded(
            child: Container(
              margin: EdgeInsets.only(right: i < 2 ? 4 : 0),
              height: 4,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(2),
                color: filled
                    ? color
                    : t.divider.withValues(alpha: t.isDark ? 0.3 : 0.5),
              ),
            ),
          );
        }),
        const SizedBox(width: 10),
        Text(
          label,
          style: AppTextStyles.caption(color).copyWith(fontWeight: FontWeight.w600),
        ),
      ],
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
