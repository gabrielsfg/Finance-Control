using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IRiskProfileService
    {
        /// <summary>Null when the user has never answered the questionnaire.</summary>
        Task<GetRiskProfileResponseDto?> GetProfileAsync(int userId);

        /// <summary>Creates or overwrites the profile. Answering again replaces the previous answers.</summary>
        Task<Result<GetRiskProfileResponseDto>> SaveProfileAsync(SaveRiskProfileRequestDto requestDto, int userId);

        Task<Result> DeleteProfileAsync(int userId);
    }
}
