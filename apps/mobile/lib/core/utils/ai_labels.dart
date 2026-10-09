/// Copy for the AI features that more than one widget shows.
library;

/// "12/200 mensagens este mês".
String aiUsageLabel(int used, int limit) =>
    limit > 0 ? '$used/$limit mensagens este mês' : '$used mensagens este mês';

/// "Você usou as 200 mensagens deste mês".
String aiChatQuotaLabel(int? limit) => limit != null && limit > 0
    ? 'Você usou as $limit mensagens deste mês'
    : 'Você usou todas as mensagens deste mês';

const aiDisabledTitle = 'Você desligou a IA';
const aiDisabledBody =
    'Ative em Perfil → IA no Quantia para voltar a receber análises e usar o assistente.';
const aiUnavailableLabel = 'Indisponível no momento';
const aiQuotaExceededLabel = 'Limite do mês atingido';
const aiNotEnoughDataLabel =
    'Ainda não há dados suficientes para a análise desta semana';

/// Suggestions shown on an empty conversation.
const aiExamplePrompts = [
  'Quanto gastei com mercado nos últimos 3 meses?',
  'Quanto gasto por mês com a tag Viagem?',
  'Estourei algum orçamento este mês?',
  'Registra um gasto de R\$ 50 no mercado hoje',
];

/// "2026-09-21" — the calendar-day shape the API takes for DateOnly fields.
String toApiDate(DateTime date) {
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '${date.year}-$month-$day';
}
