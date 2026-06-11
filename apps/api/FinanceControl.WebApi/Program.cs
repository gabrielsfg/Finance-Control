using System.Text;
using System.Threading.RateLimiting;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Extensions;
using FinanceControl.Services.Services;
using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Workers;
using FinanceControl.Services.Brapi;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

var builder = WebApplication.CreateBuilder(args);

// appsettings.Local.json — gitignored secrets file, equivalent to .env for local dev.
// Copy appsettings.Local.json.example → appsettings.Local.json and fill in your values.
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// Validate JWT token key length at startup
var jwtToken = builder.Configuration["AppSettings:Token"];
if (string.IsNullOrWhiteSpace(jwtToken) || jwtToken.Length < 32)
    throw new InvalidOperationException("AppSettings:Token must be at least 32 characters long.");

// Validate CORS config at startup (required in non-development environments)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
if (!builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
    throw new InvalidOperationException("Cors:AllowedOrigins must be configured in production.");

//DI Services
builder.Services.AddHealthChecks();
builder.Services.AddAplicationServices(builder.Configuration);
builder.Services.AddHostedService<RecurringTransactionHostedService>();
builder.Services.AddHostedService<RefreshTokenCleanupHostedService>();
builder.Services.AddHostedService<NotificationReminderHostedService>();
builder.Services.AddHostedService<BrapiPriceUpdateHostedService>();
builder.Services.AddHostedService<BrapiIntradayHostedService>();
builder.Services.AddHostedService<BrapiCleanupHostedService>();
builder.Services.AddMemoryCache();

//DI Repositories

//Add migration services.
builder.Services.AddDbContextFactory<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql =>
        {
            // Neon suspends the compute endpoint after inactivity, so the first query
            // following a cold start can fail with a transient connection error. Retry
            // transparently instead of surfacing the failure to the user.
            npgsql.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            npgsql.CommandTimeout(30);
        }), ServiceLifetime.Scoped);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo {Title = "Finance Control API", Version = "v1"});
    
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme."
    });
    
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
    });
});
builder.Services.AddValidatorsFromAssemblyContaining<CreateCategoryValidator>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidIssuer = builder.Configuration["AppSettings:Issuer"],
            ValidAudience = builder.Configuration["AppSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["AppSettings:Token"]!)),
            ValidateIssuerSigningKey = true,
        };
    });
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly, includeInternalTypes: true);

builder.Services.AddCors(options =>
{
    options.AddPolicy("WebApp", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required so the browser sends the HttpOnly refresh-token cookie
    });
});

// SameSite strategy for the HttpOnly refresh-token cookie:
//   Development  → None (browser is cross-origin between port 5xxx and 3000)
//   Production   → Lax  (web and API live under the same apex domain, e.g.
//                        app.domain.com → api.domain.com — same-site, so Lax
//                        cookies are sent on XHR/fetch)
//
// If you ever deploy web and API on completely different domains (cross-site),
// override via env var: AppSettings__CookieSameSite=None  (requires HTTPS).
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    var sameSiteCfg = builder.Configuration["AppSettings:CookieSameSite"];
    options.MinimumSameSitePolicy = sameSiteCfg is not null
        ? Enum.Parse<SameSiteMode>(sameSiteCfg)
        : builder.Environment.IsDevelopment()
            ? SameSiteMode.None
            : SameSiteMode.Lax;
    options.Secure = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
});

// Trust forwarded headers from the reverse proxy (Railway / Fly / Render).
// Without this, HttpsRedirection and cookie Secure policy read the wrong scheme.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Clear the default whitelist — cloud platforms use dynamic IPs.
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("general", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(15);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
});

var app = builder.Build();

// ForwardedHeaders must run before anything that reads scheme/IP (HTTPS redirect, cookie policy).
app.UseForwardedHeaders();

app.UseMiddleware<FinanceControl.WebApi.Middleware.GlobalExceptionMiddleware>();
app.UseMiddleware<FinanceControl.WebApi.Middleware.SecurityHeadersMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCookiePolicy();

app.UseCors("WebApp");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers().RequireRateLimiting("general");
app.MapHealthChecks("/health").AllowAnonymous();

app.Run();