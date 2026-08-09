import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/tag_repository.dart';

class TagsNotifier extends AsyncNotifier<List<TagItem>> {
  @override
  Future<List<TagItem>> build() async {
    return ref.read(tagRepositoryProvider).getAllTags();
  }
}

final tagsProvider =
    AsyncNotifierProvider<TagsNotifier, List<TagItem>>(TagsNotifier.new);
