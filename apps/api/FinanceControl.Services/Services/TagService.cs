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
        private readonly ApplicationDbContext _context;

        public TagService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GetTagResponseDto>> GetAllTagsAsync(int userId)
        {
            return await _context.Tags
                .Where(t => t.UserId == userId)
                .OrderBy(t => t.Name)
                .Select(t => new GetTagResponseDto { Id = t.Id, Name = t.Name })
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
                return Result<GetTagResponseDto>.Failure("A tag with this name already exists.");

            var tag = new Tag { UserId = userId, Name = requestDto.Name.Trim() };
            _context.Tags.Add(tag);
            await _context.SaveChangesAsync();

            return Result<GetTagResponseDto>.Success(new GetTagResponseDto { Id = tag.Id, Name = tag.Name });
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
