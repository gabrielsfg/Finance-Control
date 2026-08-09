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
import '../providers/auth_provider.dart';

/// Second step of a login when two-factor is on and the device is not trusted.
class TwoFactorPage extends ConsumerStatefulWidget {
  const TwoFactorPage({required this.challengeToken, super.key});

  /// Issued by the login call — proof the password step already succeeded.
  final String challengeToken;

  @override
  ConsumerState<TwoFactorPage> createState() => _TwoFactorPageState();
}

class _TwoFactorPageState extends ConsumerState<TwoFactorPage> {
  final _codeController = TextEditingController();
  bool _trustDevice = false;
  bool _isLoading = false;
  String? _codeError;
  String? _globalError;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final code = _codeController.text.trim();

    setState(() {
      _codeError = null;
      _globalError = null;
    });

    if (code.length != 6) {
      setState(() => _codeError = 'O código tem 6 dígitos.');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final tokens = await ref.read(authRepositoryProvider).verifyTwoFactor(
            challengeToken: widget.challengeToken,
            code: code,
            trustDevice: _trustDevice,
          );

      await ref.read(authNotifierProvider.notifier).onLoginSuccess(
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            trustedDeviceToken: tokens.trustedDeviceToken,
          );
    } on DioException catch (e) {
      setState(() {
        _globalError = e.response?.statusCode == 429
            ? 'Muitas tentativas. Aguarde alguns minutos.'
            : 'Código inválido ou expirado.';
      });
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
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: () => context.go('/login'),
                  child: Icon(Icons.arrow_back_rounded,
                      color: t.txtPrimary, size: 24),
                ),
                const SizedBox(height: 32),
                Text('Verificação em duas etapas',
                    style: AppTextStyles.h1(t.txtPrimary)),
                const SizedBox(height: 6),
                Text(
                  'Enviamos um código de 6 dígitos para o seu e-mail. '
                  'Ele vale por 10 minutos.',
                  style: AppTextStyles.body(t.txtSecondary),
                ),
                const SizedBox(height: 32),
                if (_globalError != null) ...[
                  AppErrorBanner(message: _globalError!),
                  const SizedBox(height: 16),
                ],
                AppInputField(
                  placeholder: '000000',
                  controller: _codeController,
                  errorText: _codeError,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.done,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  onChanged: (_) => setState(() => _codeError = null),
                  onSubmitted: _submit,
                ),
                const SizedBox(height: 18),
                GestureDetector(
                  onTap: () => setState(() => _trustDevice = !_trustDevice),
                  behavior: HitTestBehavior.opaque,
                  child: Row(
                    children: [
                      Icon(
                        _trustDevice
                            ? Icons.check_box_rounded
                            : Icons.check_box_outline_blank_rounded,
                        color: _trustDevice ? t.primary : t.txtTertiary,
                        size: 22,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Confiar neste dispositivo por 30 dias',
                          style: AppTextStyles.body(t.txtSecondary)
                              .copyWith(fontSize: 14),
                        ),
                      ),
                    ],
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
                    : PrimaryButton(label: 'Entrar', onPressed: _submit),
                const SizedBox(height: 20),
                // No resend: a new code needs a fresh challenge token, and only the
                // login call issues one — signing in again is the resend.
                Center(
                  child: GestureDetector(
                    onTap: () => context.go('/login'),
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
    );
  }
}
