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
        ChartId.incomeExpense => 'Income vs Expense',
        ChartId.balanceEvolution => 'Balance Evolution',
        ChartId.expensesByCategory => 'Expenses by Category',
        ChartId.topCategories => 'Top Categories',
        ChartId.categoryEvolution => 'Category Evolution',
        ChartId.budgetPace => 'Budget Pace',
        ChartId.netWorthComposition => 'Net Worth Composition',
        ChartId.netWorthEvolution => 'Net Worth Evolution',
        ChartId.futureCommitments => 'Future Commitments',
        ChartId.spendingHeatmap => 'Spending Heatmap',
        ChartId.balanceProjection => 'Balance Projection',
        ChartId.categoryProjection => 'Category Projection',
        ChartId.netWorthProjection => 'Net Worth Projection',
        ChartId.commitmentsImpact => 'Commitments Impact',
      };

  String get description => switch (this) {
        ChartId.incomeExpense => 'Monthly income vs expense grouped by month',
        ChartId.balanceEvolution => 'Day-by-day balance within the period',
        ChartId.expensesByCategory =>
          'Donut chart with drill-down by subcategory',
        ChartId.topCategories => 'Horizontal bar chart of top expense categories',
        ChartId.categoryEvolution =>
          'Monthly evolution of a specific category',
        ChartId.budgetPace => 'Actual spending vs ideal daily pace',
        ChartId.netWorthComposition =>
          'Monthly net worth broken down by account',
        ChartId.netWorthEvolution => 'Net worth trend over time',
        ChartId.futureCommitments =>
          'Upcoming installments and recurring expenses',
        ChartId.spendingHeatmap => 'Daily spending intensity calendar',
        ChartId.balanceProjection =>
          'Projected balance to end of month based on recent pace',
        ChartId.categoryProjection =>
          'Projected vs historical spending per category',
        ChartId.netWorthProjection =>
          'Net worth trend and months until target or zero',
        ChartId.commitmentsImpact =>
          'Future balance after accounting for all commitments',
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
