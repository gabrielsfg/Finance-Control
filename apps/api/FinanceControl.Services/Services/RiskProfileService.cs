using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// The declared investor profile.
    /// </summary>
    /// <remarks>
    /// The classification is a fixed points rule, computed here and never by a model. Two
    /// reasons: the user is entitled to know why they were classified the way they were,
    /// and a profile that drifts between runs cannot be contrasted with anything.
    /// <para>
    /// The profile is used only to describe the portfolio the user already holds. It is
    /// never combined with a specific asset, and nothing downstream may turn it into a
    /// recommendation.
    /// </para>
    /// </remarks>
    public class RiskProfileService : IRiskProfileService
    {
        private readonly ApplicationDbContext _context;

        public RiskProfileService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<GetRiskProfileResponseDto?> GetProfileAsync(int userId)
        {
            var profile = await _context.UserRiskProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            return profile is null ? null : ToResponse(profile);
        }

        public async Task<Result<GetRiskProfileResponseDto>> SaveProfileAsync(
            SaveRiskProfileRequestDto requestDto,
            int userId)
        {
            var profile = await _context.UserRiskProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile is null)
            {
                profile = new UserRiskProfile { UserId = userId };
                _context.UserRiskProfiles.Add(profile);
            }

            profile.InvestmentHorizon = requestDto.InvestmentHorizon;
            profile.LossTolerance = requestDto.LossTolerance;
            profile.ReserveMonthsTarget = requestDto.ReserveMonthsTarget;
            profile.ExperienceLevel = requestDto.ExperienceLevel;
            profile.Classification = Classify(requestDto);
            profile.AnsweredAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Result<GetRiskProfileResponseDto>.Success(ToResponse(profile));
        }

        public async Task<Result> DeleteProfileAsync(int userId)
        {
            var profile = await _context.UserRiskProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile is null)
                return Result.Failure("Risk profile not found.");

            _context.UserRiskProfiles.Remove(profile);
            await _context.SaveChangesAsync();

            return Result.Success();
        }

        /// <summary>
        /// Points rule, deliberately simple. Horizon and loss tolerance carry the weight
        /// because they are what a person can actually answer about themselves; experience
        /// only nudges, and the reserve target is a preference, not a risk signal.
        /// </summary>
        private static EnumRiskClassification Classify(SaveRiskProfileRequestDto answers)
        {
            var points = 0;

            points += answers.InvestmentHorizon switch
            {
                EnumInvestmentHorizon.UpToOneYear => 0,
                EnumInvestmentHorizon.OneToFiveYears => 2,
                EnumInvestmentHorizon.OverFiveYears => 4,
                _ => 0
            };

            points += answers.LossTolerance switch
            {
                EnumLossTolerance.SellEverything => 0,
                EnumLossTolerance.SellPart => 1,
                EnumLossTolerance.HoldAndWait => 3,
                EnumLossTolerance.BuyMore => 4,
                _ => 0
            };

            points += answers.ExperienceLevel switch
            {
                EnumExperienceLevel.None => 0,
                EnumExperienceLevel.Some => 1,
                EnumExperienceLevel.Extensive => 2,
                _ => 0
            };

            return points switch
            {
                <= 3 => EnumRiskClassification.Conservative,
                <= 7 => EnumRiskClassification.Moderate,
                _ => EnumRiskClassification.Aggressive
            };
        }

        /// <summary>Shown to the user, so Portuguese — a profile nobody understands is a profile nobody corrects.</summary>
        private static string BuildReason(UserRiskProfile profile)
        {
            var horizon = profile.InvestmentHorizon switch
            {
                EnumInvestmentHorizon.UpToOneYear => "prazo de até 1 ano",
                EnumInvestmentHorizon.OneToFiveYears => "prazo de 1 a 5 anos",
                _ => "prazo acima de 5 anos"
            };

            var tolerance = profile.LossTolerance switch
            {
                EnumLossTolerance.SellEverything => "venderia tudo diante de uma queda de 20%",
                EnumLossTolerance.SellPart => "venderia parte diante de uma queda de 20%",
                EnumLossTolerance.HoldAndWait => "manteria a posição diante de uma queda de 20%",
                _ => "compraria mais diante de uma queda de 20%"
            };

            var experience = profile.ExperienceLevel switch
            {
                EnumExperienceLevel.None => "sem experiência anterior",
                EnumExperienceLevel.Some => "com alguma experiência",
                _ => "com bastante experiência"
            };

            var label = profile.Classification switch
            {
                EnumRiskClassification.Conservative => "conservador",
                EnumRiskClassification.Moderate => "moderado",
                _ => "arrojado"
            };

            return $"Você respondeu {horizon}, {tolerance} e {experience}. " +
                   $"Por isso seu perfil declarado é {label}. Você pode refazer o questionário quando quiser.";
        }

        private static GetRiskProfileResponseDto ToResponse(UserRiskProfile profile) => new()
        {
            InvestmentHorizon = profile.InvestmentHorizon,
            LossTolerance = profile.LossTolerance,
            ReserveMonthsTarget = profile.ReserveMonthsTarget,
            ExperienceLevel = profile.ExperienceLevel,
            Classification = profile.Classification,
            ClassificationReason = BuildReason(profile),
            AnsweredAt = profile.AnsweredAt
        };
    }
}
