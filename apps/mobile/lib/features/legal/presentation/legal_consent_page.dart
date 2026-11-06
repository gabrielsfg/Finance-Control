import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/app_locale.dart';
import '../../../core/utils/legal_document_paths.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/legal_repository.dart';
import '../data/models/pending_legal_document.dart';
import '../providers/legal_consent_provider.dart';

/// Blocking screen shown while the signed-in user has not accepted the current
/// version of a legal document. The router sends every route here until the
/// acceptance is recorded; the only ways out are accepting or signing out.
class LegalConsentPage extends ConsumerStatefulWidget {
  const LegalConsentPage({super.key});

  @override
  ConsumerState<LegalConsentPage> createState() => _LegalConsentPageState();
}

class _LegalConsentPageState extends ConsumerState<LegalConsentPage> {
  bool _accepted = false;
  bool _submitting = false;
  String? _error;

  Future<void> _accept(List<PendingLegalDocument> pending) async {
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      await ref.read(legalRepositoryProvider).accept(pending);
      // The router leaves this screen on its own once the list comes back empty.
      ref.invalidate(pendingLegalDocumentsProvider);
    } on DioException catch (e) {
      if (!mounted) return;
      final changed = e.response?.statusCode == 409;
      setState(() {
        _accepted = false;
        _error = changed
            ? 'Os documentos foram atualizados novamente. Revise as versões '
                'atuais antes de continuar.'
            : 'Não foi possível registrar seu aceite agora. Tente novamente '
                'em instantes.';
      });
      if (changed) ref.invalidate(pendingLegalDocumentsProvider);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    final pending =
        ref.watch(pendingLegalDocumentsProvider).valueOrNull ?? const [];

    final types = pending.map((d) => d.type).toSet();
    final headline = types.contains(LegalDocumentTypes.termsOfUse) &&
            types.contains(LegalDocumentTypes.privacyPolicy)
        ? 'Atualizamos nossos Termos de Uso e Política de Privacidade'
        : types.contains(LegalDocumentTypes.termsOfUse)
            ? 'Atualizamos nossos Termos de Uso'
            : 'Atualizamos nossa Política de Privacidade';

    final canContinue = _accepted && !_submitting && pending.isNotEmpty;

    return PopScope(
      canPop: false,
      child: Scaffold(
        body: AppBackground(
          scrollable: true,
          child: SafeArea(
            child: Padding(
              padding: AppSpacing.screenPadding.copyWith(top: 32, bottom: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(headline, style: AppTextStyles.h1(t.txtPrimary)),
                  const SizedBox(height: 10),
                  Text(
                    'Para continuar usando o app, leia as novas versões abaixo e '
                    'confirme o seu aceite.',
                    style:
                        AppTextStyles.body(t.txtSecondary).copyWith(height: 1.5),
                  ),
                  const SizedBox(height: 24),
                  for (final document in pending) ...[
                    GlassCard(
                      onTap: () => context.push(
                        legalDocumentPath(
                          document.type,
                          version: document.version,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            LucideIcons.fileText,
                            size: 18,
                            color: t.txtSecondary,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  document.title,
                                  style: AppTextStyles.body(t.txtPrimary)
                                      .copyWith(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Versão ${document.version} · publicada em '
                                  '${fmt.formatDate(document.publishedAt.toLocal())}',
                                  style: AppTextStyles.caption(t.txtTertiary),
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            LucideIcons.chevronRight,
                            size: 18,
                            color: t.txtTertiary,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],
                  const SizedBox(height: 14),
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => setState(() => _accepted = !_accepted),
                    child: Row(
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: _accepted ? t.primary : Colors.transparent,
                            border: Border.all(
                              color: _accepted ? t.primary : t.divider,
                              width: 1.5,
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: _accepted
                              ? const Icon(
                                  Icons.check,
                                  size: 14,
                                  color: Colors.white,
                                )
                              : null,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Li e aceito as novas versões',
                            style: AppTextStyles.bodySm(t.txtSecondary),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    AppErrorBanner(message: _error!),
                  ],
                  const SizedBox(height: 24),
                  Opacity(
                    opacity: canContinue ? 1 : 0.5,
                    child: PrimaryButton(
                      label: _submitting ? 'Registrando…' : 'Continuar',
                      onPressed: canContinue ? () => _accept(pending) : null,
                    ),
                  ),
                  const SizedBox(height: 10),
                  AppOutlineButton(
                    label: 'Sair da conta',
                    onPressed: () =>
                        ref.read(authNotifierProvider.notifier).logout(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
