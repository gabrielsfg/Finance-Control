using System.Net.Http.Headers;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Brapi;
using FinanceControl.Services.Email;
using FinanceControl.Services.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

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
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<IAlertRuleService, AlertRuleService>();
            services.AddHttpClient();

            services.AddSingleton<RecurringTransactionJobService>();
            services.AddSingleton<RefreshTokenCleanupJobService>();
            services.AddSingleton<NotificationReminderJobService>();

            services.Configure<EmailSettings>(configuration.GetSection("EmailSettings"));
            services.AddHttpClient<IEmailService, EmailService>((provider, client) =>
            {
                var settings = provider.GetRequiredService<IOptions<EmailSettings>>().Value;
                client.BaseAddress = new Uri(settings.ApiBaseUrl);

                // Missing key is a supported state — the service logs instead of sending,
                // so local dev works without a Resend account.
                if (!string.IsNullOrWhiteSpace(settings.ApiKey))
                    client.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", settings.ApiKey);

                // Per attempt, and EmailService makes two — so a provider that has gone
                // dark costs a login 20s at worst. Resend normally answers in well under
                // a second, so anything near this ceiling is already a failure.
                client.Timeout = TimeSpan.FromSeconds(10);
            });

            services.Configure<BrapiSettings>(configuration.GetSection("BrapiSettings"));
            services.AddSingleton<BrapiPriceUpdateJobService>();
            services.AddSingleton<BrapiCleanupJobService>();

            return services;
        }
    }
}
