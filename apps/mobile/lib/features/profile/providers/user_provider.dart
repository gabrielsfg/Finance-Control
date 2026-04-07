import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/dtos/update_user_profile_request_dto.dart';
import '../data/dtos/user_profile_response_dto.dart';
import '../data/user_repository.dart';

final userProfileProvider =
    AsyncNotifierProvider<UserProfileNotifier, UserProfileResponseDto>(
  UserProfileNotifier.new,
);

class UserProfileNotifier extends AsyncNotifier<UserProfileResponseDto> {
  @override
  Future<UserProfileResponseDto> build() async {
    return ref.read(userRepositoryProvider).getProfile();
  }

  Future<void> updateProfile(UpdateUserProfileRequestDto dto) async {
    final updated =
        await ref.read(userRepositoryProvider).updateProfile(dto);
    state = AsyncData(updated);
  }
}
