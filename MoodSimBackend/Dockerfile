FROM mcr.microsoft.com/dotnet/sdk:9.0
RUN apt-get update && apt-get install -y ffmpeg libgtk-3-0 libfreetype6 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY *.csproj .
RUN dotnet restore
COPY . .
EXPOSE 5000
# DO NOT use --urls here. Let ASPNETCORE_URLS environment variable control it.
CMD ["dotnet", "run"]
