using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface ITagService
    {
        Task<IEnumerable<GetTagResponseDto>> GetAllTagsAsync(int userId);
        Task<Result<GetTagResponseDto>> CreateTagAsync(CreateTagRequestDto requestDto, int userId);
        Task<Result<bool>> DeleteTagAsync(int id, int userId);
    }
}
