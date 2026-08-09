import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/dtos/legal_document_response_dto.dart';
import '../data/legal_repository.dart';

/// Reads a published legal document. Fetched from the API rather than bundled so
/// the app can never show a version different from the one being signed.
class LegalDocumentPage extends ConsumerStatefulWidget {
  const LegalDocumentPage({
    super.key,
    required this.type,
    required this.title,
  });

  final String type;
  final String title;

  @override
  ConsumerState<LegalDocumentPage> createState() => _LegalDocumentPageState();
}

class _LegalDocumentPageState extends ConsumerState<LegalDocumentPage> {
  late Future<LegalDocumentResponseDto> _document;

  @override
  void initState() {
    super.initState();
    _document = ref.read(legalRepositoryProvider).getDocument(widget.type);
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
                Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Container(
                        width: 36,
                        height: 36,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: t.surfaceEl
                              .withValues(alpha: t.isDark ? 0.4 : 0.6),
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
                        widget.title,
                        textAlign: TextAlign.center,
                        style: AppTextStyles.h2(t.txtPrimary),
                      ),
                    ),
                    const SizedBox(width: 36),
                  ],
                ),
                const SizedBox(height: 24),
                FutureBuilder<LegalDocumentResponseDto>(
                  future: _document,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 48),
                          child: CircularProgressIndicator(
                            color: t.primary,
                            strokeWidth: 2.5,
                          ),
                        ),
                      );
                    }

                    if (snapshot.hasError || !snapshot.hasData) {
                      return Text(
                        'Não foi possível carregar este documento agora. '
                        'Tente novamente em instantes.',
                        style: AppTextStyles.body(t.txtSecondary),
                      );
                    }

                    final document = snapshot.data!;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Versão ${document.version}',
                          style: AppTextStyles.eyebrow(t.txtTertiary),
                        ),
                        const SizedBox(height: 16),
                        _MarkdownText(content: document.content),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Renders the block types the legal documents use — headings, quotes, bullets
/// and paragraphs. Not a markdown engine; the documents are plain by design.
class _MarkdownText extends StatelessWidget {
  const _MarkdownText({required this.content});

  final String content;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final blocks = <Widget>[];

    final paragraph = StringBuffer();

    void flushParagraph() {
      if (paragraph.isEmpty) return;
      blocks.add(Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Text(
          paragraph.toString().trim(),
          style: AppTextStyles.body(t.txtSecondary).copyWith(height: 1.55),
        ),
      ));
      paragraph.clear();
    }

    for (final rawLine in content.replaceAll('\r\n', '\n').split('\n')) {
      final line = rawLine.trim();

      if (line.isEmpty) {
        flushParagraph();
        continue;
      }

      if (line.startsWith('###')) {
        flushParagraph();
        blocks.add(Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 8),
          child: Text(
            line.replaceFirst(RegExp(r'^#{1,3}\s*'), ''),
            style: AppTextStyles.h3(t.txtPrimary),
          ),
        ));
        continue;
      }

      if (line.startsWith('#')) {
        flushParagraph();
        blocks.add(Padding(
          padding: const EdgeInsets.only(top: 16, bottom: 8),
          child: Text(
            line.replaceFirst(RegExp(r'^#{1,3}\s*'), ''),
            style: AppTextStyles.h2(t.txtPrimary),
          ),
        ));
        continue;
      }

      if (line.startsWith('>')) {
        flushParagraph();
        blocks.add(Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          decoration: BoxDecoration(
            color: t.gold.withValues(alpha: 0.08),
            border: Border(left: BorderSide(color: t.gold, width: 2)),
          ),
          child: Text(
            line.replaceFirst(RegExp(r'^>\s*'), ''),
            style: AppTextStyles.bodySm(t.txtSecondary).copyWith(height: 1.5),
          ),
        ));
        continue;
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        flushParagraph();
        blocks.add(Padding(
          padding: const EdgeInsets.only(bottom: 8, left: 4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('• ', style: AppTextStyles.body(t.txtSecondary)),
              Expanded(
                child: Text(
                  line.substring(2).trim(),
                  style:
                      AppTextStyles.body(t.txtSecondary).copyWith(height: 1.5),
                ),
              ),
            ],
          ),
        ));
        continue;
      }

      // Hard-wrapped source: a plain line continues the paragraph above it.
      paragraph.write('${paragraph.isEmpty ? '' : ' '}$line');
    }

    flushParagraph();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: blocks,
    );
  }
}
