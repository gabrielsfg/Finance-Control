/// Parser for the assistant's reply format: plain text, paragraphs separated
/// by blank lines, "- " list items and `**bold**`. The prompt allows nothing
/// richer, so a markdown dependency would only add surface.
library;

/// A run of text inside a paragraph or list item.
class ChatSpan {
  const ChatSpan(this.text, {this.bold = false});

  final String text;
  final bool bold;
}

/// A paragraph (one item in [lines]) or a bullet list (one entry per item).
class ChatBlock {
  const ChatBlock.paragraph(List<ChatSpan> spans)
      : isList = false,
        items = const [],
        paragraph = spans;

  const ChatBlock.list(this.items)
      : isList = true,
        paragraph = const [];

  final bool isList;
  final List<ChatSpan> paragraph;
  final List<List<ChatSpan>> items;
}

final _listItem = RegExp(r'^\s*[-*•]\s+');

List<ChatBlock> parseChatContent(String content) {
  final blocks = <ChatBlock>[];
  final paragraphLines = <String>[];
  final listItems = <List<ChatSpan>>[];

  void flushParagraph() {
    if (paragraphLines.isEmpty) return;
    blocks.add(ChatBlock.paragraph(parseChatSpans(paragraphLines.join('\n'))));
    paragraphLines.clear();
  }

  void flushList() {
    if (listItems.isEmpty) return;
    blocks.add(ChatBlock.list(List.of(listItems)));
    listItems.clear();
  }

  for (final rawLine in content.replaceAll('\r\n', '\n').split('\n')) {
    final line = rawLine.trimRight();
    if (line.trim().isEmpty) {
      flushParagraph();
      flushList();
      continue;
    }
    if (_listItem.hasMatch(line)) {
      flushParagraph();
      listItems.add(parseChatSpans(line.replaceFirst(_listItem, '')));
    } else {
      flushList();
      paragraphLines.add(line.trim());
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

/// Splits on `**` pairs; an unmatched trailing `**` is kept as literal text.
List<ChatSpan> parseChatSpans(String text) {
  final spans = <ChatSpan>[];
  var rest = text;
  while (rest.isNotEmpty) {
    final open = rest.indexOf('**');
    if (open < 0) break;
    final close = rest.indexOf('**', open + 2);
    if (close < 0) break;
    if (open > 0) spans.add(ChatSpan(rest.substring(0, open)));
    final bold = rest.substring(open + 2, close);
    if (bold.isNotEmpty) spans.add(ChatSpan(bold, bold: true));
    rest = rest.substring(close + 2);
  }
  if (rest.isNotEmpty) spans.add(ChatSpan(rest));
  return spans;
}
