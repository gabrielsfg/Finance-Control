# Build stage — SDK image compiles and publishes the app
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files first so dotnet restore is a cached layer.
# This layer only re-runs when a .csproj changes, not on every code edit.
COPY FinanceControl.sln .
COPY FinanceControl.WebApi/FinanceControl.WebApi.csproj       FinanceControl.WebApi/
COPY FinanceControl.Services/FinanceControl.Services.csproj   FinanceControl.Services/
COPY FinanceControl.Data/FinanceControl.Data.csproj           FinanceControl.Data/
COPY FinanceControl.Domain/FinanceControl.Domain.csproj       FinanceControl.Domain/
COPY FinanceControl.Shared/FinanceControl.Shared.csproj       FinanceControl.Shared/
COPY FinanceControl.Workers/FinanceControl.Workers.csproj     FinanceControl.Workers/

RUN dotnet restore FinanceControl.WebApi/FinanceControl.WebApi.csproj

# Copy source and publish in Release mode
COPY . .
RUN dotnet publish FinanceControl.WebApi/FinanceControl.WebApi.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# Runtime stage — slim ASP.NET image, no SDK overhead
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Run as non-root user
RUN addgroup --system --gid 1001 appgroup \
 && adduser  --system --uid 1001 --ingroup appgroup appuser

COPY --from=build /app/publish .

USER appuser

# Railway routes traffic to port 8080 by default.
# ASPNETCORE_HTTP_PORTS tells Kestrel which port to bind.
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "FinanceControl.WebApi.dll"]
