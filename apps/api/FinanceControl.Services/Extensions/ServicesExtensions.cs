using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Brapi;
using FinanceControl.Services.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceControl.Services.Extensions
{
    public static class ServicesExtensions
    {
        public static IServiceCollection AddAplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IImportService, ImportService>();
            services.AddScoped<ICategoryService, CategoryService>();
            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<IBudgetService, BudgetService>();
            services.AddScoped<ISubCategoryService, SubCategoryService>();
            services.AddScoped<ITransactionService, TransactionService>();
            services.AddScoped<ITagService, TagService>();
            services.AddScoped<IGoalService, GoalService>();
            services.AddScoped<IAnalyticsService, AnalyticsService>();
            services.AddScoped<IInvestmentService, InvestmentService>();
            services.AddScoped<IMarketService, MarketService>();
            services.AddScoped<ISimulationService, SimulationService>();
            services.AddScoped<IRecurrencePageService, RecurrencePageService>();
            services.AddHttpClient();

            services.AddSingleton<RecurringTransactionJobService>();
            services.AddSingleton<RefreshTokenCleanupJobService>();

            services.Configure<BrapiSettings>(configuration.GetSection("BrapiSettings"));
            services.AddSingleton<BrapiPriceUpdateJobService>();
            services.AddSingleton<BrapiCleanupJobService>();

            return services;
        }
    }
}
