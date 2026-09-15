using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Helpers;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Helpers
{
    /// <summary>
    /// Resolves user-typed tag names to the user's tag rows, creating what is missing.
    /// Shared because transactions are tagged from more than one place — the transaction
    /// form and the investment register — and two implementations of "is this the same
    /// tag?" would let the same name become two rows.
    /// </summary>
    public static class TagAssociationHelper
    {
        /// <summary>
        /// Replaces the tags of <paramref name="transactions"/> with the ones named in
        /// <paramref name="tagNames"/>. Does not save when there is nothing to attach.
        /// </summary>
        public static async Task AssociateAsync(
            ApplicationDbContext context,
            IEnumerable<Transaction> transactions,
            IEnumerable<string>? tagNames,
            int userId)
        {
            var requestedNames = (tagNames ?? [])
                .Select(n => n.Trim())
                .Where(n => n.Length > 0)
                .DistinctBy(TextNormalization.ToComparisonKey)
                .ToList();

            if (requestedNames.Count == 0)
                return;

            // The whole tag list, matched in memory by comparison key. Looking the names up
            // with an IN clause is resolved case-sensitively by Postgres: sending "viagem"
            // when "Viagem" already existed created a second tag, and the two drifted apart
            // from there. Accents did the same to "férias". A user has a handful of tags, so
            // loading them is cheaper than being wrong.
            var userTags = await context.Tags
                .Where(t => t.UserId == userId)
                .ToListAsync();

            var tagsByKey = new Dictionary<string, Tag>();
            foreach (var tag in userTags)
                tagsByKey.TryAdd(TextNormalization.ToComparisonKey(tag.Name), tag);

            var resolvedTags = new List<Tag>();
            foreach (var name in requestedNames)
            {
                var key = TextNormalization.ToComparisonKey(name);
                if (key.Length == 0)
                    continue;

                // An existing tag keeps its own spelling — the first one created is the
                // canonical one, and later transactions attach to it rather than renaming it.
                if (tagsByKey.TryGetValue(key, out var existing))
                {
                    resolvedTags.Add(existing);
                    continue;
                }

                var created = new Tag { UserId = userId, Name = name };
                context.Tags.Add(created);
                tagsByKey[key] = created;
                resolvedTags.Add(created);
            }

            await context.SaveChangesAsync();

            foreach (var transaction in transactions)
            {
                var fullTransaction = await context.Transactions
                    .Include(t => t.Tags)
                    .FirstAsync(t => t.Id == transaction.Id);

                fullTransaction.Tags.Clear();
                foreach (var tag in resolvedTags)
                    fullTransaction.Tags.Add(tag);
            }

            await context.SaveChangesAsync();
        }
    }
}
