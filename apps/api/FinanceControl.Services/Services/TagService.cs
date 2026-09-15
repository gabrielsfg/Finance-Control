using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Helpers;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class TagService : ITagService
    {
        /// <summary>Distinguishes a name clash from every other failure — the controller
        /// answers it with 409 so the caller can offer to merge instead.</summary>
        public const string TagNameTakenError = "A tag with this name already exists.";

        private readonly ApplicationDbContext _context;

        public TagService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GetTagItemResponseDto>> GetAllTagsAsync(int userId)
        {
            return await _context.Tags
                .Where(t => t.UserId == userId)
                .OrderBy(t => t.Name)
                .Select(t => new GetTagItemResponseDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    TransactionCount = t.Transactions.Count,
                })
                .ToListAsync();
        }

        public async Task<Result<GetTagResponseDto>> CreateTagAsync(CreateTagRequestDto requestDto, int userId)
        {
            // Compared by the same key the transaction form uses, so "Férias" and "ferias"
            // cannot both exist — the point of a tag is that everything filed under it
            // comes back together.
            var key = TextNormalization.ToComparisonKey(requestDto.Name);
            if (key.Length == 0)
                return Result<GetTagResponseDto>.Failure("Tag name is required.");

            var userTagNames = await _context.Tags
                .Where(t => t.UserId == userId)
                .Select(t => t.Name)
                .ToListAsync();

            if (userTagNames.Any(name => TextNormalization.ToComparisonKey(name) == key))
                return Result<GetTagResponseDto>.Failure(TagNameTakenError);

            var tag = new Tag { UserId = userId, Name = requestDto.Name.Trim() };
            _context.Tags.Add(tag);
            await _context.SaveChangesAsync();

            return Result<GetTagResponseDto>.Success(new GetTagResponseDto { Id = tag.Id, Name = tag.Name });
        }

        /// <summary>
        /// Renames a tag in place, so every transaction filed under it stays filed under it
        /// — fixing a typo must not cost the user the markings. When the new name is
        /// already taken, the rename is refused unless <c>Merge</c> says to fold this tag
        /// into that one.
        /// </summary>
        public async Task<Result<GetTagResponseDto>> UpdateTagAsync(int id, UpdateTagRequestDto requestDto, int userId)
        {
            var key = TextNormalization.ToComparisonKey(requestDto.Name);
            if (key.Length == 0)
                return Result<GetTagResponseDto>.Failure("Tag name is required.");

            var tag = await _context.Tags
                .Include(t => t.Transactions)
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (tag is null)
                return Result<GetTagResponseDto>.Failure("Tag not found.");

            var siblings = await _context.Tags
                .Include(t => t.Transactions)
                .Where(t => t.UserId == userId && t.Id != id)
                .ToListAsync();

            var clash = siblings.FirstOrDefault(t => TextNormalization.ToComparisonKey(t.Name) == key);

            if (clash is null)
            {
                tag.Name = requestDto.Name.Trim();
                await _context.SaveChangesAsync();
                return Result<GetTagResponseDto>.Success(new GetTagResponseDto { Id = tag.Id, Name = tag.Name });
            }

            if (!requestDto.Merge)
                return Result<GetTagResponseDto>.Failure(TagNameTakenError);

            // Fold this tag into the existing one: every transaction it marks moves over,
            // skipping the ones already carrying the target tag, and the emptied tag goes.
            foreach (var transaction in tag.Transactions)
            {
                if (!clash.Transactions.Any(t => t.Id == transaction.Id))
                    clash.Transactions.Add(transaction);
            }

            tag.Transactions.Clear();
            _context.Tags.Remove(tag);
            await _context.SaveChangesAsync();

            return Result<GetTagResponseDto>.Success(new GetTagResponseDto { Id = clash.Id, Name = clash.Name });
        }

        public async Task<Result<bool>> DeleteTagAsync(int id, int userId)
        {
            var tag = await _context.Tags
                .Include(t => t.Transactions)
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (tag is null)
                return Result<bool>.Failure("Tag not found.");

            if (tag.Transactions.Count > 0)
                return Result<bool>.Failure("Cannot delete a tag that is associated with transactions.");

            _context.Tags.Remove(tag);
            await _context.SaveChangesAsync();

            return Result<bool>.Success(true);
        }
    }
}
