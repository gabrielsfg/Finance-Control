import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/feedback_repository.dart';

/// Matches CreateFeedbackValidator on the API.
const _commentMax = 2000;

/// Opens the "Reportar resposta" sheet for an AI answer ([aiMessageId]) or an
/// AI analysis ([aiInsightId]). Shows the thank-you snackbar once the report
/// lands.
Future<void> showReportAiContentSheet(
  BuildContext context, {
  int? aiMessageId,
  int? aiInsightId,
}) async {
  final messenger = ScaffoldMessenger.of(context);
  final sent = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => ReportAiContentSheet(
      aiMessageId: aiMessageId,
      aiInsightId: aiInsightId,
    ),
  );
  if (sent == true) {
    messenger.showSnackBar(
      const SnackBar(content: Text('Obrigado! Vamos analisar.')),
    );
  }
}

/// The small report icon shown next to AI-generated content.
class ReportAiContentButton extends StatelessWidget {
  const ReportAiContentButton({super.key, required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Tooltip(
      message: 'Reportar resposta',
      child: InkResponse(
        onTap: onPressed,
        radius: 18,
        child: Padding(
          padding: const EdgeInsets.all(6),
          child: Icon(
            LucideIcons.flag,
            size: 14,
            color: t.txtTertiary,
            semanticLabel: 'Reportar resposta',
          ),
        ),
      ),
    );
  }
}

class ReportAiContentSheet extends ConsumerStatefulWidget {
  const ReportAiContentSheet({super.key, this.aiMessageId, this.aiInsightId});

  final int? aiMessageId;
  final int? aiInsightId;

  @override
  ConsumerState<ReportAiContentSheet> createState() =>
      _ReportAiContentSheetState();
}

class _ReportAiContentSheetState extends ConsumerState<ReportAiContentSheet> {
  final _comment = TextEditingController();
  bool _sending = false;
  String? _error;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      final comment = _comment.text.trim();
      await ref.read(feedbackRepositoryProvider).reportAiContent(
            aiMessageId: widget.aiMessageId,
            aiInsightId: widget.aiInsightId,
            comment: comment.isEmpty ? null : comment,
          );
      if (mounted) context.pop(true);
    } catch (_) {
      if (mounted) {
        setState(() {
          _sending = false;
          _error = 'Não foi possível enviar agora. Tente novamente.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        padding: EdgeInsets.fromLTRB(20, 12, 20, bottomPad + 20),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius:
              const BorderRadius.vertical(top: Radius.circular(AppRadius.xl3)),
          border: Border.all(color: t.mist),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: t.mist,
                  borderRadius: AppRadius.pillAll,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Reportar resposta',
              style: AppTextStyles.body(t.txtPrimary).copyWith(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Encontrou algo incorreto ou inadequado? Vamos revisar.',
              style: AppTextStyles.bodySm(t.txtSecondary),
            ),
            const SizedBox(height: 16),
            AppInputField(
              controller: _comment,
              placeholder: 'Conte o que está errado (opcional)',
              maxLines: 5,
              minLines: 3,
              maxLength: _commentMax,
              textCapitalization: TextCapitalization.sentences,
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              AppErrorBanner(message: _error!),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: _sending
                  ? const Center(child: CircularProgressIndicator())
                  : PrimaryButton(label: 'Enviar', onPressed: _submit),
            ),
          ],
        ),
      ),
    );
  }
}
