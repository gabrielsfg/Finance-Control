using System.Security.Claims;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using Microsoft.Extensions.Caching.Memory;

namespace FinanceControl.WebApi.Middleware;

/// <summary>
/// Keeps the application access records the Marco Civil da Internet requires (art. 15):
/// user, date and time (UTC) and IP address of each authenticated use of the API.
/// </summary>
/// <remarks>
/// One row per user, address and hour — the court order the record exists for asks "who
/// used this IP at that moment", and an hour bucket answers it without a write per
/// request. The source port is kept only when the connection reached us directly: behind
/// the hosting proxy the port seen is the proxy's, and a wrong port is worse than none.
/// A failure here never fails the request.
/// </remarks>
public class AccessLogMiddleware(RequestDelegate next, IMemoryCache cache, ILogger<AccessLogMiddleware> logger)
{
    private static readonly TimeSpan Bucket = TimeSpan.FromHours(1);

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
    {
        await next(context);

        var claim = context.User.FindFirst(ClaimTypes.NameIdentifier) ?? context.User.FindFirst("userId");
        var ip = context.Connection.RemoteIpAddress?.ToString();
        if (claim is null || !int.TryParse(claim.Value, out var userId) || string.IsNullOrEmpty(ip))
            return;

        var now = DateTime.UtcNow;
        var key = $"access-log:{userId}:{ip}:{now:yyyyMMddHH}";
        if (cache.TryGetValue(key, out _))
            return;
        cache.Set(key, true, Bucket);

        try
        {
            var forwarded = context.Request.Headers.ContainsKey("X-Original-For");
            dbContext.AccessLogs.Add(new AccessLog
            {
                UserId = userId,
                IpAddress = ip,
                SourcePort = forwarded ? null : context.Connection.RemotePort
            });
            await dbContext.SaveChangesAsync(context.RequestAborted);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(exception, "Could not record the access of user {UserId}.", userId);
        }
    }
}
