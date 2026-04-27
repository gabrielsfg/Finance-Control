import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/dtos/create_wishlist_item_request_dto.dart';
import '../data/dtos/update_wishlist_item_request_dto.dart';
import '../data/models/wishlist_item.dart';
import '../providers/wishlist_provider.dart';

class WishlistFormPage extends ConsumerStatefulWidget {
  const WishlistFormPage({super.key, this.item});

  /// If non-null, the form is in edit mode.
  final WishlistItem? item;

  @override
  ConsumerState<WishlistFormPage> createState() => _WishlistFormPageState();
}

class _WishlistFormPageState extends ConsumerState<WishlistFormPage> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _targetPriceController = TextEditingController();
  final _urlController = TextEditingController();

  String _priority = 'Medium';
  bool _isLoading = false;
  String? _error;

  bool get _isEdit => widget.item != null;

  static const _priorities = ['Low', 'Medium', 'High'];

  @override
  void initState() {
    super.initState();
    final item = widget.item;
    if (item != null) {
      _nameController.text = item.name;
      _descriptionController.text = item.description ?? '';
      _urlController.text = item.url ?? '';
      _priority = switch (item.priority) {
        WishlistPriority.high => 'High',
        WishlistPriority.medium => 'Medium',
        WishlistPriority.low => 'Low',
      };
      if (item.targetPriceCents != null) {
        // Format as "1.234,56" (no currency symbol) by stripping the symbol from formatCurrency output
        _targetPriceController.text =
            formatCurrency(item.targetPriceCents!).replaceFirst(RegExp(r'^R\$\s*'), '');
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _targetPriceController.dispose();
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Name is required.');
      return;
    }

    final targetCents = _targetPriceController.text.isEmpty
        ? null
        : CentsInputFormatter.parseCents(_targetPriceController.text);

    if (targetCents != null && targetCents <= 0) {
      setState(() => _error = 'Target price must be greater than zero.');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      if (_isEdit) {
        await ref.read(wishlistProvider.notifier).updateItem(
              widget.item!.id,
              UpdateWishlistItemRequestDto(
                name: name,
                description: _descriptionController.text.trim().isEmpty
                    ? null
                    : _descriptionController.text.trim(),
                targetPrice: targetCents,
                priority: _priority,
                url: _urlController.text.trim().isEmpty
                    ? null
                    : _urlController.text.trim(),
              ),
            );
      } else {
        await ref.read(wishlistProvider.notifier).create(
              CreateWishlistItemRequestDto(
                name: name,
                description: _descriptionController.text.trim().isEmpty
                    ? null
                    : _descriptionController.text.trim(),
                targetPrice: targetCents,
                priority: _priority,
                url: _urlController.text.trim().isEmpty
                    ? null
                    : _urlController.text.trim(),
              ),
            );
      }
      if (mounted) context.pop();
    } catch (_) {
      setState(() => _error = 'Could not save item. Try again.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Scaffold(
      body: AppBackground(
        scrollable: true,
        child: SafeArea(
          child: Padding(
            padding: AppSpacing.screenPadding.copyWith(bottom: 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),

                // ── Header ────────────────────────────────────────────────
                Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.isDark
                              ? Colors.white.withValues(alpha: 0.07)
                              : Colors.black.withValues(alpha: 0.05),
                        ),
                        child: Icon(
                          Icons.arrow_back_ios_new_rounded,
                          size: 16,
                          color: t.txtPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Text(
                      _isEdit ? 'Edit item' : 'New wishlist item',
                      style: AppTextStyles.h1(t.txtPrimary),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                if (_error != null) ...[
                  _ErrorBanner(message: _error!),
                  const SizedBox(height: 16),
                ],

                // ── Name ──────────────────────────────────────────────────
                _Label('Name'),
                const SizedBox(height: 8),
                AppInputField(
                  placeholder: 'e.g. AirPods Pro',
                  controller: _nameController,
                  textCapitalization: TextCapitalization.sentences,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 20),

                // ── Description ───────────────────────────────────────────
                _Label('Description (optional)'),
                const SizedBox(height: 8),
                AppInputField(
                  placeholder: 'Notes about this item...',
                  controller: _descriptionController,
                  textCapitalization: TextCapitalization.sentences,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 20),

                // ── Target price ──────────────────────────────────────────
                _Label('Target price (optional)'),
                const SizedBox(height: 8),
                AppInputField(
                  placeholder: '0,00',
                  controller: _targetPriceController,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.next,
                  inputFormatters: [const CentsInputFormatter()],
                ),
                const SizedBox(height: 20),

                // ── URL ───────────────────────────────────────────────────
                _Label('Link (optional)'),
                const SizedBox(height: 8),
                AppInputField(
                  placeholder: 'https://...',
                  controller: _urlController,
                  keyboardType: TextInputType.url,
                  textInputAction: TextInputAction.done,
                  onSubmitted: _submit,
                ),
                const SizedBox(height: 20),

                // ── Priority ──────────────────────────────────────────────
                _Label('Priority'),
                const SizedBox(height: 10),
                Row(
                  children: _priorities.map((p) {
                    final isSelected = _priority == p;
                    final color = switch (p) {
                      'High' => const Color(0xFFEF4444),
                      'Medium' => const Color(0xFFF59E0B),
                      _ => const Color(0xFF22C55E),
                    };
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _priority = p),
                        child: Container(
                          margin: EdgeInsets.only(
                            right: p != 'High' ? 8 : 0,
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? color.withValues(alpha: 0.15)
                                : t.isDark
                                    ? Colors.white.withValues(alpha: 0.04)
                                    : Colors.black.withValues(alpha: 0.03),
                            borderRadius: AppRadius.baseAll,
                            border: Border.all(
                              color: isSelected
                                  ? color
                                  : t.divider.withValues(alpha: 0.3),
                              width: isSelected ? 1.5 : 1,
                            ),
                          ),
                          child: Center(
                            child: Text(
                              p,
                              style: AppTextStyles.bodySm(
                                isSelected ? color : t.txtSecondary,
                              ).copyWith(
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.w400,
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 36),

                // ── Submit ────────────────────────────────────────────────
                _isLoading
                    ? Center(
                        child: SizedBox(
                          height: 48,
                          child: Center(
                            child: CircularProgressIndicator(
                              color: t.primary,
                              strokeWidth: 2.5,
                            ),
                          ),
                        ),
                      )
                    : PrimaryButton(
                        label: _isEdit ? 'Save changes' : 'Add to wishlist',
                        onPressed: _submit,
                      ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Text(
      text,
      style: AppTextStyles.bodySm(t.txtSecondary)
          .copyWith(fontWeight: FontWeight.w500),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: t.error.withValues(alpha: t.isDark ? 0.15 : 0.08),
        borderRadius: AppRadius.baseAll,
        border: Border.all(color: t.error.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: t.error, size: 18),
          const SizedBox(width: 10),
          Expanded(child: Text(message, style: AppTextStyles.bodySm(t.error))),
        ],
      ),
    );
  }
}
