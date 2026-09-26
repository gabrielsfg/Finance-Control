import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/chat_content.dart';
import '../data/ai_models.dart';
import 'ai_action_card.dart';

/// One message of the chat: a bubble (user on the right, assistant on the
/// left) and, below an assistant reply, the proposals it attached.
class AssistantMessageView extends StatelessWidget {
  const AssistantMessageView({
    super.key,
    required this.message,
    this.onRetry,
  });

  final AiMessage message;

  /// Shown on an error reply: resends the user message it answered.
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final isUser = message.isUser;
    final pending = message.id < 0;

    final bubble = Container(
      constraints: BoxConstraints(
        maxWidth: MediaQuery.sizeOf(context).width * 0.8,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isUser
            ? t.primary.withValues(alpha: t.isDark ? 0.28 : 0.12)
            : message.isError
                ? t.surfaceEl
                : t.surface,
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(AppRadius.lg),
          topRight: const Radius.circular(AppRadius.lg),
          bottomLeft: Radius.circular(isUser ? AppRadius.lg : 4),
          bottomRight: Radius.circular(isUser ? 4 : AppRadius.lg),
        ),
        border: isUser ? null : Border.all(color: t.mist),
      ),
      child: isUser
          ? Text(
              message.content,
              style: AppTextStyles.body(t.txtPrimary).copyWith(fontSize: 14),
            )
          : ChatContent(
              content: message.content,
              color: message.isError ? t.txtTertiary : t.txtPrimary,
            ),
    );

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment:
            isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Opacity(opacity: pending ? 0.6 : 1, child: bubble),
          if (message.isError && onRetry != null) ...[
            const SizedBox(height: 6),
            GestureDetector(
              onTap: onRetry,
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.refreshCw, size: 13, color: t.accent),
                    const SizedBox(width: 6),
                    Text(
                      'Tentar novamente',
                      style: AppTextStyles.bodySm(t.accent)
                          .copyWith(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
          ],
          for (final action in message.actions) ...[
            const SizedBox(height: 8),
            AiActionCard(action: action),
          ],
        ],
      ),
    );
  }
}

/// Renders the reply format: paragraphs, "- " lists and **bold**.
class ChatContent extends StatelessWidget {
  const ChatContent({super.key, required this.content, required this.color});

  final String content;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final base = AppTextStyles.body(color).copyWith(fontSize: 14, height: 1.45);
    final blocks = parseChatContent(content);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < blocks.length; i++) ...[
          if (i > 0) const SizedBox(height: 8),
          if (blocks[i].isList)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final item in blocks[i].items)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 3),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('•  ', style: base),
                        Expanded(child: _spansText(item, base)),
                      ],
                    ),
                  ),
              ],
            )
          else
            _spansText(blocks[i].paragraph, base),
        ],
      ],
    );
  }

  Widget _spansText(List<ChatSpan> spans, TextStyle base) => Text.rich(
        TextSpan(
          children: [
            for (final span in spans)
              TextSpan(
                text: span.text,
                style: span.bold
                    ? base.copyWith(fontWeight: FontWeight.w700)
                    : base,
              ),
          ],
        ),
      );
}

/// "Consultando seus dados…" with three pulsing dots, while a reply is on its
/// way (the call is not streamed and can take half a minute).
class AssistantTypingIndicator extends StatefulWidget {
  const AssistantTypingIndicator({super.key});

  @override
  State<AssistantTypingIndicator> createState() =>
      _AssistantTypingIndicatorState();
}

class _AssistantTypingIndicatorState extends State<AssistantTypingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(AppRadius.lg),
              topRight: Radius.circular(AppRadius.lg),
              bottomRight: Radius.circular(AppRadius.lg),
              bottomLeft: Radius.circular(4),
            ),
            border: Border.all(color: t.mist),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedBuilder(
                animation: _controller,
                builder: (_, _) => Row(
                  children: List.generate(3, (i) {
                    final phase = (_controller.value - i * 0.2) % 1.0;
                    final opacity = phase < 0.5 ? 0.3 + phase * 1.4 : 1.0 - (phase - 0.5) * 1.4;
                    return Container(
                      width: 6,
                      height: 6,
                      margin: const EdgeInsets.only(right: 4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: t.accent.withValues(alpha: opacity.clamp(0.3, 1.0)),
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                'Consultando seus dados…',
                style: AppTextStyles.bodySm(t.txtSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
