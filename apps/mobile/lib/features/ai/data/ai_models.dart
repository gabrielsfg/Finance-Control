// Domain models for the AI features: weekly analyses, the "IA no Quantia"
// settings and the chat assistant. Plain classes with manual fromJson — the
// API serializes enums as their names and money as integer cents.

/// Why an AI feature can or cannot answer right now. Every analysis and chat
/// call answers 200 with one of these; only [available] carries content.
enum AiAvailability {
  available,
  notPremium,
  aiDisabled,
  unavailable,
  quotaExceeded,
  notEnoughData;

  static AiAvailability fromJson(String? value) => switch (value) {
        'Available' => AiAvailability.available,
        'NotPremium' => AiAvailability.notPremium,
        'AiDisabled' => AiAvailability.aiDisabled,
        'QuotaExceeded' => AiAvailability.quotaExceeded,
        'NotEnoughData' => AiAvailability.notEnoughData,
        _ => AiAvailability.unavailable,
      };
}

enum AiMessageRole {
  user,
  assistant;

  static AiMessageRole fromJson(String? value) =>
      value == 'User' ? AiMessageRole.user : AiMessageRole.assistant;
}

enum AiActionKind {
  createTransaction,
  updateTransaction,
  createGoal,
  createBudget;

  static AiActionKind fromJson(String? value) => switch (value) {
        'CreateTransaction' => AiActionKind.createTransaction,
        'UpdateTransaction' => AiActionKind.updateTransaction,
        'CreateGoal' => AiActionKind.createGoal,
        _ => AiActionKind.createBudget,
      };

  bool get isTransaction =>
      this == AiActionKind.createTransaction ||
      this == AiActionKind.updateTransaction;
}

enum AiActionStatus {
  pending,
  confirmed,
  cancelled,
  expired,
  failed;

  static AiActionStatus fromJson(String? value) => switch (value) {
        'Pending' => AiActionStatus.pending,
        'Confirmed' => AiActionStatus.confirmed,
        'Cancelled' => AiActionStatus.cancelled,
        'Expired' => AiActionStatus.expired,
        _ => AiActionStatus.failed,
      };
}

/// The server stores UTC; a timestamp without an offset is read as UTC so the
/// expiry of a proposal is not shifted by the device's time zone.
DateTime _parseServerDateTime(String? value) {
  if (value == null || value.isEmpty) return DateTime.now();
  final hasOffset = RegExp(r'(Z|[+-]\d{2}:?\d{2})$').hasMatch(value);
  final parsed = DateTime.tryParse(hasOffset ? value : '${value}Z');
  return (parsed ?? DateTime.now()).toLocal();
}

// ── Weekly analyses ──────────────────────────────────────────────────────────

/// Which weekly analysis a card shows.
enum AiInsightKind { spending, portfolio }

class AiInsight {
  const AiInsight({
    required this.kind,
    required this.periodStart,
    required this.headline,
    required this.paragraphs,
    required this.generatedAt,
    required this.generatedByAi,
  });

  /// "SpendingWeekly" | "PortfolioSnapshot"
  final String kind;
  final DateTime periodStart;
  final String headline;
  final List<String> paragraphs;
  final DateTime generatedAt;

  /// False when the deterministic writer produced the text instead of a model.
  final bool generatedByAi;

  factory AiInsight.fromJson(Map<String, dynamic> json) => AiInsight(
        kind: json['kind'] as String? ?? '',
        periodStart: DateTime.tryParse(json['periodStart'] as String? ?? '') ??
            DateTime.now(),
        headline: json['headline'] as String? ?? '',
        paragraphs: ((json['paragraphs'] as List?) ?? const [])
            .map((e) => (e as Map<String, dynamic>)['text'] as String? ?? '')
            .where((text) => text.trim().isNotEmpty)
            .toList(),
        generatedAt: _parseServerDateTime(json['generatedAt'] as String?),
        generatedByAi: json['generatedByAi'] as bool? ?? false,
      );
}

class AiInsightResult {
  const AiInsightResult({required this.status, this.insight});

  final AiAvailability status;

  /// Set on [AiAvailability.available], and on [AiAvailability.quotaExceeded]
  /// when an analysis of the same week is cached.
  final AiInsight? insight;

  factory AiInsightResult.fromJson(Map<String, dynamic> json) =>
      AiInsightResult(
        status: AiAvailability.fromJson(json['status'] as String?),
        insight: json['insight'] is Map<String, dynamic>
            ? AiInsight.fromJson(json['insight'] as Map<String, dynamic>)
            : null,
      );
}

// ── Settings ─────────────────────────────────────────────────────────────────

class AiSettings {
  const AiSettings({
    required this.aiEnabled,
    required this.isPremium,
    required this.isAvailable,
    required this.provider,
    required this.chatMessagesUsed,
    required this.chatMessagesLimit,
    required this.insightCount,
    required this.conversationCount,
  });

  /// The user's own switch.
  final bool aiEnabled;
  final bool isPremium;

  /// False while the platform has the integration switched off.
  final bool isAvailable;

  /// Who processes the data, named on screen.
  final String provider;
  final int chatMessagesUsed;
  final int chatMessagesLimit;
  final int insightCount;
  final int conversationCount;

  factory AiSettings.fromJson(Map<String, dynamic> json) => AiSettings(
        aiEnabled: json['aiEnabled'] as bool? ?? false,
        isPremium: json['isPremium'] as bool? ?? false,
        isAvailable: json['isAvailable'] as bool? ?? false,
        provider: json['provider'] as String? ?? 'Anthropic',
        chatMessagesUsed: (json['chatMessagesUsed'] as num?)?.toInt() ?? 0,
        chatMessagesLimit: (json['chatMessagesLimit'] as num?)?.toInt() ?? 0,
        insightCount: (json['insightCount'] as num?)?.toInt() ?? 0,
        conversationCount: (json['conversationCount'] as num?)?.toInt() ?? 0,
      );

  AiSettings copyWith({
    bool? aiEnabled,
    int? chatMessagesUsed,
    int? chatMessagesLimit,
    int? insightCount,
    int? conversationCount,
  }) =>
      AiSettings(
        aiEnabled: aiEnabled ?? this.aiEnabled,
        isPremium: isPremium,
        isAvailable: isAvailable,
        provider: provider,
        chatMessagesUsed: chatMessagesUsed ?? this.chatMessagesUsed,
        chatMessagesLimit: chatMessagesLimit ?? this.chatMessagesLimit,
        insightCount: insightCount ?? this.insightCount,
        conversationCount: conversationCount ?? this.conversationCount,
      );

  /// The state the chat opens in before any message is sent, or null when it
  /// can be used.
  AiAvailability? get chatBlock {
    if (!isAvailable) return AiAvailability.unavailable;
    if (!isPremium) return AiAvailability.notPremium;
    if (!aiEnabled) return AiAvailability.aiDisabled;
    if (chatMessagesLimit > 0 && chatMessagesUsed >= chatMessagesLimit) {
      return AiAvailability.quotaExceeded;
    }
    return null;
  }
}

// ── Assistant ────────────────────────────────────────────────────────────────

class AiConversationSummary {
  const AiConversationSummary({
    required this.id,
    required this.title,
    required this.createdAt,
    required this.lastMessageAt,
  });

  final int id;
  final String title;
  final DateTime createdAt;
  final DateTime lastMessageAt;

  factory AiConversationSummary.fromJson(Map<String, dynamic> json) =>
      AiConversationSummary(
        id: (json['id'] as num).toInt(),
        title: json['title'] as String? ?? '',
        createdAt: _parseServerDateTime(json['createdAt'] as String?),
        lastMessageAt: _parseServerDateTime(json['lastMessageAt'] as String?),
      );
}

class AiConversation {
  const AiConversation({
    required this.id,
    required this.title,
    required this.messages,
  });

  final int id;
  final String title;

  /// Oldest first.
  final List<AiMessage> messages;

  factory AiConversation.fromJson(Map<String, dynamic> json) => AiConversation(
        id: (json['id'] as num).toInt(),
        title: json['title'] as String? ?? '',
        messages: ((json['messages'] as List?) ?? const [])
            .map((e) => AiMessage.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class AiMessage {
  const AiMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.createdAt,
    required this.isError,
    required this.actions,
  });

  /// Negative for the optimistic copy of a message still being sent.
  final int id;
  final AiMessageRole role;

  /// Plain text with blank-line paragraphs, "- " lists and **bold**.
  final String content;
  final DateTime createdAt;

  /// The fixed apology after a provider failure — the chat offers a retry.
  final bool isError;
  final List<AiAction> actions;

  bool get isUser => role == AiMessageRole.user;

  factory AiMessage.fromJson(Map<String, dynamic> json) => AiMessage(
        id: (json['id'] as num).toInt(),
        role: AiMessageRole.fromJson(json['role'] as String?),
        content: json['content'] as String? ?? '',
        createdAt: _parseServerDateTime(json['createdAt'] as String?),
        isError: json['isError'] as bool? ?? false,
        actions: ((json['actions'] as List?) ?? const [])
            .map((e) => AiAction.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  factory AiMessage.pendingUser(String content) => AiMessage(
        id: -DateTime.now().microsecondsSinceEpoch,
        role: AiMessageRole.user,
        content: content,
        createdAt: DateTime.now(),
        isError: false,
        actions: const [],
      );

  AiMessage withActions(List<AiAction> actions) => AiMessage(
        id: id,
        role: role,
        content: content,
        createdAt: createdAt,
        isError: isError,
        actions: actions,
      );
}

class AiActionPreviewLine {
  const AiActionPreviewLine({required this.label, required this.value});

  final String label;
  final String value;
}

/// A confirmation card: what the assistant proposes to write.
class AiAction {
  const AiAction({
    required this.id,
    required this.kind,
    required this.status,
    required this.payload,
    required this.targetId,
    required this.previewTitle,
    required this.previewLines,
    required this.expiresAt,
    required this.resultId,
    required this.error,
  });

  final int id;
  final AiActionKind kind;
  final AiActionStatus status;

  /// The request confirming sends — edited fields are merged into a copy.
  final Map<String, dynamic> payload;
  final int? targetId;
  final String previewTitle;
  final List<AiActionPreviewLine> previewLines;
  final DateTime expiresAt;
  final int? resultId;
  final String? error;

  /// A pending card past its expiry can no longer be confirmed, even before the
  /// server has marked it.
  AiActionStatus get effectiveStatus =>
      status == AiActionStatus.pending && DateTime.now().isAfter(expiresAt)
          ? AiActionStatus.expired
          : status;

  factory AiAction.fromJson(Map<String, dynamic> json) {
    final preview = json['preview'] as Map<String, dynamic>? ?? const {};
    return AiAction(
      id: (json['id'] as num).toInt(),
      kind: AiActionKind.fromJson(json['kind'] as String?),
      status: AiActionStatus.fromJson(json['status'] as String?),
      payload: json['payload'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['payload'] as Map<String, dynamic>)
          : <String, dynamic>{},
      targetId: (json['targetId'] as num?)?.toInt(),
      previewTitle: preview['title'] as String? ?? '',
      previewLines: ((preview['lines'] as List?) ?? const [])
          .map((e) => e as Map<String, dynamic>)
          .map((e) => AiActionPreviewLine(
                label: e['label'] as String? ?? '',
                value: e['value'] as String? ?? '',
              ))
          .toList(),
      expiresAt: _parseServerDateTime(json['expiresAt'] as String?),
      resultId: (json['resultId'] as num?)?.toInt(),
      error: json['error'] as String?,
    );
  }
}

class AiSendMessageResult {
  const AiSendMessageResult({
    required this.status,
    required this.conversationId,
    required this.conversationTitle,
    required this.userMessage,
    required this.assistantMessage,
    required this.messagesUsed,
    required this.messagesLimit,
  });

  /// Anything but [AiAvailability.available] means nothing was stored.
  final AiAvailability status;
  final int? conversationId;
  final String? conversationTitle;
  final AiMessage? userMessage;
  final AiMessage? assistantMessage;
  final int messagesUsed;
  final int messagesLimit;

  factory AiSendMessageResult.fromJson(Map<String, dynamic> json) =>
      AiSendMessageResult(
        status: AiAvailability.fromJson(json['status'] as String?),
        conversationId: (json['conversationId'] as num?)?.toInt(),
        conversationTitle: json['conversationTitle'] as String?,
        userMessage: json['userMessage'] is Map<String, dynamic>
            ? AiMessage.fromJson(json['userMessage'] as Map<String, dynamic>)
            : null,
        assistantMessage: json['assistantMessage'] is Map<String, dynamic>
            ? AiMessage.fromJson(
                json['assistantMessage'] as Map<String, dynamic>)
            : null,
        messagesUsed: (json['messagesUsed'] as num?)?.toInt() ?? 0,
        messagesLimit: (json['messagesLimit'] as num?)?.toInt() ?? 0,
      );
}

/// Thrown by a confirm that the server rejected with a validation message; the
/// card stays pending and shows it.
class AiActionRejected implements Exception {
  const AiActionRejected(this.message);

  final String message;

  @override
  String toString() => message;
}
