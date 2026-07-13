FROM mcr.microsoft.com/dotnet/sdk:9.0
WORKDIR /app
COPY . .
RUN dotnet restore
EXPOSE 5000
# DO NOT use --urls here. Let ASPNETCORE_URLS environment variable control it.
CMD ["dotnet", "run"]