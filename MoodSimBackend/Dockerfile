FROM mcr.microsoft.com/dotnet/sdk:9.0
WORKDIR /app
COPY *.csproj .
RUN dotnet restore
COPY . .
EXPOSE 5000
# DO NOT use --urls here. Let ASPNETCORE_URLS environment variable control it.
CMD ["dotnet", "run"]