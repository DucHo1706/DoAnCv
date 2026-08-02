FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj và restore dependencies
COPY ["RecruitmentBackend/RecruitmentBackend.csproj", "RecruitmentBackend/"]
RUN dotnet restore "RecruitmentBackend/RecruitmentBackend.csproj"

# Copy toàn bộ mã nguồn và build dự án
COPY . .
WORKDIR "/src/RecruitmentBackend"
RUN dotnet build "RecruitmentBackend.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RecruitmentBackend.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=publish /app/publish .

# Tạo thư mục lưu trữ CV tải lên
RUN mkdir -p /app/Uploads

# Mở các cổng HTTP của Backend
EXPOSE 8080

ENTRYPOINT ["dotnet", "RecruitmentBackend.dll"]
