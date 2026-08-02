using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Services;
using RecruitmentBackend.Settings;
using RecruitmentBackend.Models;
using RecruitmentBackend.Filters;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Cấu hình Kestrel Web Server: Giới hạn tối đa 10MB cho toàn bộ Payload HTTP Request
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10 MB
});

// Cấu hình FormOptions: Giới hạn Upload File và dữ liệu Form Payload (10MB Max File, 1MB Max String)
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10 MB
    options.ValueLengthLimit = 1 * 1024 * 1024; // 1 MB per form field
    options.MultipartHeadersLengthLimit = 16384;
});

// 1. Đăng ký DbContext với SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Cấu hình CORS cho React (Cổng 3000 thường dùng cho React)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.WithOrigins(
            "http://localhost:3000",
            "http://localhost:5173")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials());
});

// Đăng ký SignalR
builder.Services.AddSignalR();
builder.Services.AddHealthChecks();

// Nginx terminates TLS and forwards the original client IP/scheme.
// The backend port is only exposed on the private Docker network.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Đăng ký Controllers kết hợp bộ lọc tự động Làm sạch dữ liệu (Input Sanitizer & ModelState Validation)
builder.Services.AddControllers(options =>
{
    options.Filters.Add<InputSanitizerFilter>();
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Recruitment Backend API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập token JWT theo dạng: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));

// 3. Đăng ký các Services
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddHttpClient<IAiService, AiService>();
builder.Services.AddScoped<IJobService, JobService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJobPositionService, JobPositionService>();
builder.Services.AddScoped<IApplicationService, ApplicationService>();
builder.Services.AddScoped<IAiEvaluationService, AiEvaluationService>();
builder.Services.AddScoped<IInterviewService, InterviewService>();
builder.Services.AddScoped<IRecruitmentService, RecruitmentService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IBranchService, BranchService>();
builder.Services.AddScoped<IJobLevelService, JobLevelService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddHttpClient<IChatbotService, ChatbotService>();
builder.Services.AddScoped<IEmailSenderService, EmailSenderService>();
builder.Services.AddHttpClient<ICandidateEmailAiService, CandidateEmailAiService>();
builder.Services.AddScoped<ITalentPoolService, TalentPoolService>();
builder.Services.AddScoped<IAprioriService, AprioriService>();
builder.Services.AddScoped<IHighUtilityService, HighUtilityService>();
builder.Services.AddHostedService<MiningSchedulerService>();
builder.Services.AddScoped<ICandidateComparisonService, CandidateComparisonService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IProfileService, ProfileService>();

// 4. Cấu hình Rate Limiting toàn cục cho Backend (Giới hạn 100 requests / 1 phút per IP)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_ip";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            });
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";
        var response = new
        {
            status = 429,
            message = "Hệ thống ghi nhận quá nhiều yêu cầu từ thiết bị của bạn. Vui lòng thử lại sau 1 phút."
        };
        await context.HttpContext.Response.WriteAsJsonAsync(response, token);
    };
});

var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});


var app = builder.Build();

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Sử dụng CORS & Rate Limiting
app.UseCors("AllowReactApp");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

// Map SignalR Hub
app.MapHub<RecruitmentBackend.Hubs.AIEvaluationHub>("/hubs/ai-evaluation");
app.MapHub<RecruitmentBackend.Hubs.NotificationHub>("/hubs/notifications");

var uploadPath = Path.Combine(builder.Environment.ContentRootPath, "Uploads");
if (!Directory.Exists(uploadPath))
{
    Directory.CreateDirectory(uploadPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadPath),
    RequestPath = "/Uploads"
});
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<Account>();
    var accounts = await context.Accounts.ToListAsync();
    bool updatedAny = false;
    
    foreach (var account in accounts)
    {
        if (string.IsNullOrEmpty(account.PasswordHash))
        {
            continue;
        }
        
        if (account.PasswordHash.StartsWith("AQAAAA") == false)
        {
            Console.WriteLine($"Migrating account password to secure hash: {account.Email}");
            account.PasswordHash = passwordHasher.HashPassword(account, account.PasswordHash);
            updatedAny = true;
        }
    }
    
    if (updatedAny)
    {
        await context.SaveChangesAsync();
        Console.WriteLine("All plain-text passwords successfully migrated to secure hashes!");
    }
}

app.Run();
