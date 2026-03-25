import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../providers/categories_provider.dart';

class CreateCategoryPage extends ConsumerStatefulWidget {
  const CreateCategoryPage({super.key});

  @override
  ConsumerState<CreateCategoryPage> createState() => _CreateCategoryPageState();
}

class _CreateCategoryPageState extends ConsumerState<CreateCategoryPage> {
  final _nameController = TextEditingController();
  String? _errorText;
  bool _loading = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _errorText = 'Digite um nome para a categoria');
      return;
    }
    setState(() {
      _loading = true;
      _errorText = null;
    });
    try {
      await ref.read(categoriesNotifierProvider.notifier).createCategory(name);
      if (mounted) context.pop();
    } catch (_) {
      if (mounted) {
        setState(() => _errorText = 'Erro ao criar categoria. Tente novamente.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Scaffold(
      backgroundColor: t.bg,
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              Padding(
                padding: AppSpacing.screenPadding.copyWith(top: 8, bottom: 0),
                child: const _Header(),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: AppSpacing.screenPadding.copyWith(top: 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _FieldLabel(label: 'Nome da categoria', tokens: t),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _nameController,
                        autofocus: true,
                        textCapitalization: TextCapitalization.sentences,
                        style: AppTextStyles.body(t.txtPrimary),
                        decoration: InputDecoration(
                          hintText: 'Ex: Alimentação, Transporte...',
                          hintStyle: AppTextStyles.body(t.txtDisabled),
                          errorText: _errorText,
                          filled: true,
                          fillColor: t.isDark
                              ? Colors.white.withValues(alpha: 0.05)
                              : const Color(0xFF7C3AED).withValues(alpha: 0.04),
                          border: OutlineInputBorder(
                            borderRadius: AppRadius.baseAll,
                            borderSide: BorderSide(color: t.divider),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: AppRadius.baseAll,
                            borderSide: BorderSide(color: t.divider),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: AppRadius.baseAll,
                            borderSide:
                                BorderSide(color: t.primary, width: 1.5),
                          ),
                          errorBorder: OutlineInputBorder(
                            borderRadius: AppRadius.baseAll,
                            borderSide: BorderSide(color: t.error),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 14,
                          ),
                        ),
                        onChanged: (_) {
                          if (_errorText != null) {
                            setState(() => _errorText = null);
                          }
                        },
                        onSubmitted: (_) => _submit(),
                      ),
                      const SizedBox(height: 32),
                      _SubmitButton(loading: _loading, onTap: _submit),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Header ─────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Row(
      children: [
        GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: t.primary.withValues(alpha: t.isDark ? 0.15 : 0.1),
              border: Border.all(
                color: t.primary.withValues(alpha: 0.25),
                width: 1,
              ),
            ),
            child: Icon(LucideIcons.chevronLeft, size: 18, color: t.primary),
          ),
        ),
        Expanded(
          child: Text(
            'Nova Categoria',
            textAlign: TextAlign.center,
            style: AppTextStyles.body(t.txtPrimary).copyWith(
              fontWeight: FontWeight.w700,
              fontSize: 17,
            ),
          ),
        ),
        const SizedBox(width: 36),
      ],
    );
  }
}

// ── Field Label ────────────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  final String label;
  final AppThemeTokens tokens;

  const _FieldLabel({required this.label, required this.tokens});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: AppTextStyles.bodySm(tokens.txtSecondary).copyWith(
        fontWeight: FontWeight.w600,
        fontSize: 13,
      ),
    );
  }
}

// ── Submit Button ──────────────────────────────────────────────────────────

class _SubmitButton extends StatelessWidget {
  final bool loading;
  final VoidCallback onTap;

  const _SubmitButton({required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: loading ? null : onTap,
      child: Container(
        height: 52,
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: loading ? null : AppColors.primaryGradient,
          color: loading ? t.primary.withValues(alpha: 0.4) : null,
          borderRadius: AppRadius.baseAll,
          boxShadow: loading ? [] : AppShadows.primaryBtnShadow,
        ),
        child: Center(
          child: loading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : Text(
                  'Criar Categoria',
                  style: AppTextStyles.body(Colors.white).copyWith(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
        ),
      ),
    );
  }
}
