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

// Brapi sync jobs — desativados enquanto a assinatura está cancelada (pré-lançamento).
// Sem assinatura ativa eles só acumulariam erro de autenticação a cada janela de sync.
// Reativar junto com a assinatura: basta descomentar as três linhas. O restante do
// Brapi (BrapiSettings, os JobServices, os endpoints de mercado sob demanda) continua
// registrado — só a execução agendada está parada.
// builder.Services.AddHostedService<BrapiPriceUpdateHostedService>();
// builder.Services.AddHostedService<BrapiIntradayHostedService>();
// builder.Services.AddHostedService<BrapiCleanupHostedService>();
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

    // Both policies are partitioned by caller IP. AddFixedWindowLimiter builds a single
    // limiter shared by every request on the policy, which means one user burning the
    // budget locks out everyone else — with "auth" at five per fifteen minutes, two
    // people signing up at once was enough to break the second one.
    //
    // Behind the reverse proxy the real client address arrives via X-Forwarded-For, which
    // UseForwardedHeaders has already folded into RemoteIpAddress by the time this runs.
    options.AddPolicy("general", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: GetClientKey(httpContext),
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 100,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        }));

    // 20 per 15 minutes per IP. The old budget of 5 predates the emailed codes and is now
    // too tight to reach the app's own limits: a signup spends one request registering and
    // one verifying, a wrong code costs another, and the code itself allows five attempts
    // before it burns. At 5 the rate limiter fired first and the user hit a wall that read
    // like a bug. Brute force is still bounded by the things that actually count it — the
    // account lockout after 5 bad passwords and the 5 attempts per code.
    options.AddPolicy("auth", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: GetClientKey(httpContext),
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 20,
            Window = TimeSpan.FromMinutes(15),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        }));

    // A missing remote address (in-process test hosts, some socket setups) would otherwise
    // collapse every such caller into one partition, so they share a named bucket instead
    // of silently sharing the anonymous one.
    static string GetClientKey(HttpContext httpContext) =>
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
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