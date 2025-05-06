#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
# Install Node.js - added to fix the Node.js dependency
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
# Verify Node.js installation
RUN node --version && npm --version

ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["devexchange.client/nuget.config", "devexchange.client/"]
COPY ["DevExchange.Server/DevExchange.Server.csproj", "DevExchange.Server/"]
COPY ["devexchange.client/devexchange.client.esproj", "devexchange.client/"]
# Create necessary directories with proper permissions - added to fix permission issues
RUN mkdir -p /src/DevExchange.Server/obj && \
    chmod -R 777 /src
RUN dotnet restore "./DevExchange.Server/DevExchange.Server.csproj"
COPY . .
# Ensure proper permissions after copying all files
RUN chmod -R 777 /src
WORKDIR "/src/DevExchange.Server"
RUN dotnet build "./DevExchange.Server.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./DevExchange.Server.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "DevExchange.Server.dll"]