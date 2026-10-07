import 'package:flutter_test/flutter_test.dart';
import 'package:finance_control_front/core/utils/chat_content.dart';

void main() {
  group('parseChatContent', () {
    test('splits paragraphs on blank lines and groups "- " items', () {
      final blocks = parseChatContent(
        'Primeiro parágrafo.\n\n- item um\n- item **dois**\n\nFim.',
      );

      expect(blocks, hasLength(3));
      expect(blocks[0].isList, isFalse);
      expect(blocks[1].isList, isTrue);
      expect(blocks[1].items, hasLength(2));
      expect(blocks[1].items[1].last.text, 'dois');
      expect(blocks[1].items[1].last.bold, isTrue);
      expect(blocks[2].paragraph.single.text, 'Fim.');
    });

    test('keeps an unmatched ** as literal text', () {
      final spans = parseChatSpans('Total **R\$ 50 sem fechar');

      expect(spans, hasLength(1));
      expect(spans.single.text, 'Total **R\$ 50 sem fechar');
      expect(spans.single.bold, isFalse);
    });
  });
}
