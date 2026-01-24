using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Services;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Extensions
{
    public static class ServicesExtensions
    {
        public static IServiceCollection AddAplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<ICategoryService, CategoryService>();
            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<IBudgetService, BudgetService>();
            services.AddScoped<ISubCategoryService, SubCategoryService>();
            services.AddScoped<IAreaService, AreaService>();
            services.AddScoped<IAreaCategoryService, AreaCategoryService>();

            return services;
        }
    }
}
