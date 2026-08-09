import 'dart:async';

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

/// Confirms the address with the 6-digit code, then signs the user in.
///
/// Reached right after registering, and also from a login whose account was never
/// verified — that path re-sends the code before landing here.
class VerifyEmailPage extends ConsumerStatefulWidget {
  const VerifyEmailPage({required this.email, super.key});

  final String email;

  @override
  ConsumerState<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends ConsumerState<VerifyEmailPage> {
  static const _resendCooldownSeconds = 60;

  final _codeController = TextEditingController();
  Timer? _cooldownTimer;
  int _secondsLeft = _resendCooldownSeconds;
  bool _isLoading = false;
  bool _isResending = false;
  String? _codeError;
  String? _globalError;

  @override
  void initState() {
    super.initState();
    _startCooldown();
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    _codeController.dispose();
    super.dispose();
  }

  /// The API ignores a resend inside its own 60s window, so the button stays
  /// disabled for that long — otherwise it would report success and no second
  /// email would arrive. A code was just sent to get here, hence the head start.
  void _startCooldown() {
    _cooldownTimer?.cancel();
    setState(() => _secondsLeft = _resendCooldownSeconds);
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return timer.cancel();
      setState(() => _secondsLeft--);
      if (_secondsLeft <= 0) timer.cancel();
    });
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
      final tokens = await ref.read(authRepositoryProvider).verifyEmail(
            email: widget.email,
            code: code,
          );

      // Confirming the code proves the address, so the API hands over the tokens
      // here — the router redirect takes it from there.
      await ref.read(authNotifierProvider.notifier).onLoginSuccess(
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
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

  Future<void> _resend() async {
    setState(() {
      _isResending = true;
      _globalError = null;
    });
    try {
      await ref.read(authRepositoryProvider).resendVerificationCode(widget.email);
      _startCooldown();
    } on DioException catch (e) {
      setState(() {
        _globalError = e.response?.statusCode == 429
            ? 'Muitas tentativas. Aguarde alguns minutos.'
            : 'Não foi possível reenviar o código.';
      });
    } finally {
      if (mounted) setState(() => _isResending = false);
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
                Text('Confirme seu e-mail',
                    style: AppTextStyles.h1(t.txtPrimary)),
                const SizedBox(height: 6),
                Text(
                  'Enviamos um código de 6 dígitos para ${widget.email}. '
                  'Ele vale por 15 minutos.',
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
                        label: 'Confirmar e entrar',
                        onPressed: _submit,
                      ),
                const SizedBox(height: 20),
                Center(
                  child: _secondsLeft > 0
                      ? Text(
                          'Reenviar código em ${_secondsLeft}s',
                          style: AppTextStyles.body(t.txtTertiary)
                              .copyWith(fontSize: 14),
                        )
                      : GestureDetector(
                          onTap: _isResending ? null : _resend,
                          child: Text(
                            _isResending ? 'Enviando…' : 'Reenviar código',
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
