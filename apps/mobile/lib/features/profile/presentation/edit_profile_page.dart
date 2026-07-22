import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/dtos/update_user_profile_request_dto.dart';
import '../data/dtos/user_profile_response_dto.dart';
import '../providers/user_provider.dart';

class EditProfilePage extends ConsumerStatefulWidget {
  const EditProfilePage({super.key});

  @override
  ConsumerState<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends ConsumerState<EditProfilePage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();

  bool _initialized = false;
  bool _isSaving = false;
  String? _nameError;
  String? _emailError;
  String? _submitError;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  void _initFromProfile(UserProfileResponseDto profile) {
    if (_initialized) return;
    _initialized = true;
    _nameController.text = profile.name;
    _emailController.text = profile.email;
  }

  bool _validate() {
    String? nameErr;
    String? emailErr;

    if (_nameController.text.trim().isEmpty) {
      nameErr = 'Informe o nome';
    }

    final email = _emailController.text.trim();
    if (email.isEmpty) {
      emailErr = 'Informe o e-mail';
    } else if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(email)) {
      emailErr = 'E-mail inválido';
    }

    setState(() {
      _nameError = nameErr;
      _emailError = emailErr;
    });

    return nameErr == null && emailErr == null;
  }

  Future<void> _save() async {
    if (!_validate()) return;

    setState(() {
      _isSaving = true;
      _submitError = null;
    });

    try {
      await ref.read(userProfileProvider.notifier).updateProfile(
            UpdateUserProfileRequestDto(
              name: _nameController.text.trim(),
              email: _emailController.text.trim(),
            ),
          );
      if (mounted) context.pop();
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      setState(() {
        _submitError = status == 400
            ? 'E-mail já está em uso.'
            : 'Não foi possível salvar as alterações. Tente novamente.';
      });
    } catch (_) {
      setState(() => _submitError = 'Erro inesperado. Tente novamente.');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);
    final t = AppThemeTokens.of(context);

    profileAsync.whenData(_initFromProfile);

    return Scaffold(
      body: AppBackground(
        scrollable: true,
        child: SafeArea(
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                _buildHeader(context, t),
                const SizedBox(height: 32),
                if (_submitError != null) ...[
                  _ErrorBanner(message: _submitError!),
                  const SizedBox(height: 20),
                ],
                AppInputField(
                  placeholder: 'Nome',
                  controller: _nameController,
                  errorText: _nameError,
                  textInputAction: TextInputAction.next,
                  onChanged: (_) => setState(() => _nameError = null),
                ),
                const SizedBox(height: 14),
                AppInputField(
                  placeholder: 'E-mail',
                  controller: _emailController,
                  errorText: _emailError,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.done,
                  onSubmitted: _save,
                  onChanged: (_) => setState(() => _emailError = null),
                ),
                const SizedBox(height: 32),
                _isSaving
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
                    : PrimaryButton(label: 'Salvar alterações', onPressed: _save),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, AppThemeTokens t) {
    return Row(
      children: [
        GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: t.surfaceEl,
              border: Border.all(color: t.mist),
            ),
            child: Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 16,
              color: t.txtPrimary,
            ),
          ),
        ),
        const SizedBox(width: 14),
        Text('Editar perfil', style: AppTextStyles.h1(t.txtPrimary)),
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
