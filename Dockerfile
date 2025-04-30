FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["Backend/FurnitureDelivery.API/FurnitureDelivery.API.csproj", "Backend/FurnitureDelivery.API/"]
RUN dotnet restore "Backend/FurnitureDelivery.API/FurnitureDelivery.API.csproj"
COPY . .
WORKDIR "/src/Backend/FurnitureDelivery.API"
RUN dotnet build "FurnitureDelivery.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "FurnitureDelivery.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "FurnitureDelivery.API.dll"]