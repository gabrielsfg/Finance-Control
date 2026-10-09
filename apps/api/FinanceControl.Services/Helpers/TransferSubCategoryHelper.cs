using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Helpers
{
    /// <summary>
    /// Resolves the per-user system "Transferência" subcategory every transfer is filed
    /// under, so transfers never pollute expense/income analytics. Shared because both the
    /// transaction form and the file import create transfers — an import that kept the
    /// reviewer's category left the transfer counted as spending.
    /// </summary>
    public static class TransferSubCategoryHelper
    {
        /// <summary>
        /// Returns the id of the system transfer subcategory, creating it (and the system
        /// "Outros" category it hangs from) on demand. Mirrors the registration seed.
        /// </summary>
        public static async Task<int> GetIdAsync(ApplicationDbContext context, int userId)
        {
            var subCategory = await context.SubCategories
                .FirstOrDefaultAsync(s => s.UserId == userId && s.IsSystem && (s.Name == "Transferência" || s.Name == "Transfer"));
            if (subCategory is not null)
                return subCategory.Id;

            var category = await context.Categories
                .FirstOrDefaultAsync(c => c.UserId == userId && c.IsSystem && (c.Name == "Outros" || c.Name == "Other"));
            if (category is null)
            {
                category = new Category { UserId = userId, Name = "Outros", IsSystem = true };
                context.Categories.Add(category);
                await context.SaveChangesAsync();
            }

            var sub = new SubCategory { UserId = userId, CategoryId = category.Id, Name = "Transferência", IsSystem = true };
            context.SubCategories.Add(sub);
            await context.SaveChangesAsync();
            return sub.Id;
        }
    }
}
