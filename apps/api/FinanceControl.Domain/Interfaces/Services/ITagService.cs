using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface ITagService
    {
        Task<IEnumerable<GetTagItemResponseDto>> GetAllTagsAsync(int userId);
        Task<Result<GetTagResponseDto>> CreateTagAsync(CreateTagRequestDto requestDto, int userId);
        Task<Result<GetTagResponseDto>> UpdateTagAsync(int id, UpdateTagRequestDto requestDto, int userId);
        Task<Result<bool>> DeleteTagAsync(int id, int userId);
    }
}
