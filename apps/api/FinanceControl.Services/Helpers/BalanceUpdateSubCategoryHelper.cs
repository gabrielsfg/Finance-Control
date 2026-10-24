using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Helpers
{
    /// <summary>
    /// Resolves the per-user system "BalanceUpdate" subcategory that balance adjustments
    /// (initial balance, "adjust to the bank's balance") are filed under.
    /// </summary>
    public static class BalanceUpdateSubCategoryHelper
    {
        public const string Name = "BalanceUpdate";

        /// <summary>Returns its id, creating it (and its system category) on demand.</summary>
        public static async Task<int> GetIdAsync(ApplicationDbContext context, int userId)
        {
            var existing = await context.SubCategories
                .Where(s => s.UserId == userId && s.IsSystem && s.Name == Name)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync();

            if (existing.HasValue)
                return existing.Value;

            var category = await context.Categories
                .FirstOrDefaultAsync(c => c.UserId == userId && c.IsSystem && c.Name == Name);

            if (category is null)
            {
                category = new Category { UserId = userId, Name = Name, IsSystem = true };
                context.Categories.Add(category);
                await context.SaveChangesAsync();
            }

            var subCategory = new SubCategory
            {
                UserId = userId,
                CategoryId = category.Id,
                Name = Name,
                IsSystem = true,
            };
            context.SubCategories.Add(subCategory);
            await context.SaveChangesAsync();
            return subCategory.Id;
        }
    }
}
