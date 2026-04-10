import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/area_repository.dart';

class AreasNotifier extends AsyncNotifier<List<AreaItem>> {
  @override
  Future<List<AreaItem>> build() async {
    return ref.read(areaRepositoryProvider).getAllAreas();
  }
}

final areasProvider =
    AsyncNotifierProvider<AreasNotifier, List<AreaItem>>(AreasNotifier.new);
