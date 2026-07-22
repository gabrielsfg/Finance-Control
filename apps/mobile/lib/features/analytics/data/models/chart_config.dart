import 'dart:convert';

enum ChartId {
  incomeExpense,
  balanceEvolution,
  expensesByCategory,
  topCategories,
  categoryEvolution,
  budgetPace,
  netWorthComposition,
  netWorthEvolution,
  futureCommitments,
  spendingHeatmap,
  // Projections
  balanceProjection,
  categoryProjection,
  netWorthProjection,
  commitmentsImpact,
}

extension ChartIdLabel on ChartId {
  String get label => switch (this) {
        ChartId.incomeExpense => 'Receitas vs despesas',
        ChartId.balanceEvolution => 'Evolução do saldo',
        ChartId.expensesByCategory => 'Despesas por categoria',
        ChartId.topCategories => 'Principais categorias',
        ChartId.categoryEvolution => 'Evolução por categoria',
        ChartId.budgetPace => 'Ritmo do orçamento',
        ChartId.netWorthComposition => 'Composição do patrimônio',
        ChartId.netWorthEvolution => 'Evolução do patrimônio',
        ChartId.futureCommitments => 'Compromissos futuros',
        ChartId.spendingHeatmap => 'Mapa de calor de gastos',
        ChartId.balanceProjection => 'Projeção do saldo',
        ChartId.categoryProjection => 'Projeção por categoria',
        ChartId.netWorthProjection => 'Projeção do patrimônio',
        ChartId.commitmentsImpact => 'Impacto dos compromissos',
      };

  String get description => switch (this) {
        ChartId.incomeExpense => 'Receitas e despesas agrupadas por mês',
        ChartId.balanceEvolution => 'Saldo dia a dia dentro do período',
        ChartId.expensesByCategory =>
          'Gráfico de rosca com detalhamento por subcategoria',
        ChartId.topCategories => 'Gráfico de barras das maiores categorias de despesa',
        ChartId.categoryEvolution =>
          'Evolução mensal de uma categoria específica',
        ChartId.budgetPace => 'Gastos reais vs ritmo diário ideal',
        ChartId.netWorthComposition =>
          'Patrimônio mensal detalhado por conta',
        ChartId.netWorthEvolution => 'Tendência do patrimônio ao longo do tempo',
        ChartId.futureCommitments =>
          'Parcelas e despesas recorrentes futuras',
        ChartId.spendingHeatmap => 'Calendário de intensidade de gastos diários',
        ChartId.balanceProjection =>
          'Saldo projetado até o fim do mês com base no ritmo recente',
        ChartId.categoryProjection =>
          'Gastos projetados vs históricos por categoria',
        ChartId.netWorthProjection =>
          'Tendência do patrimônio e meses até a meta ou zero',
        ChartId.commitmentsImpact =>
          'Saldo futuro considerando todos os compromissos',
      };

  bool get isProjection => switch (this) {
        ChartId.balanceProjection ||
        ChartId.categoryProjection ||
        ChartId.netWorthProjection ||
        ChartId.commitmentsImpact =>
          true,
        _ => false,
      };
}

class ChartConfig {
  const ChartConfig({
    required this.chartId,
    required this.enabled,
    required this.order,
  });

  final ChartId chartId;
  final bool enabled;
  final int order;

  ChartConfig copyWith({bool? enabled, int? order}) => ChartConfig(
        chartId: chartId,
        enabled: enabled ?? this.enabled,
        order: order ?? this.order,
      );

  Map<String, dynamic> toJson() => {
        'chartId': chartId.name,
        'enabled': enabled,
        'order': order,
      };

  factory ChartConfig.fromJson(Map<String, dynamic> j) => ChartConfig(
        chartId: ChartId.values.firstWhere((e) => e.name == j['chartId']),
        enabled: j['enabled'] as bool,
        order: j['order'] as int,
      );

  static List<ChartConfig> defaultConfigs() {
    final defaults = [
      ChartId.incomeExpense,
      ChartId.expensesByCategory,
      ChartId.netWorthEvolution,
    ];
    return ChartId.values.indexed.map((entry) {
      final (i, id) = entry;
      return ChartConfig(
        chartId: id,
        enabled: defaults.contains(id),
        order: i,
      );
    }).toList();
  }

  static List<ChartConfig> fromJsonString(String jsonString) {
    try {
      final list = jsonDecode(jsonString) as List;
      if (list.isEmpty) return defaultConfigs();
      return list.map((e) => ChartConfig.fromJson(e)).toList()
        ..sort((a, b) => a.order.compareTo(b.order));
    } catch (_) {
      return defaultConfigs();
    }
  }

  static String toJsonString(List<ChartConfig> configs) =>
      jsonEncode(configs.map((c) => c.toJson()).toList());
}
