using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class MiningSchedulerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MiningSchedulerService> _logger;
        private readonly string _statePath;

        public MiningSchedulerService(IServiceProvider serviceProvider, ILogger<MiningSchedulerService> logger,
            IWebHostEnvironment environment)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _statePath = Path.Combine(environment.ContentRootPath, "App_Data", "skill-mining-state.json");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(_statePath)!);
            _logger.LogInformation("Skill mining scheduler started. Checking input at startup, then at 02:00 Vietnam time.");

            try
            {
                await RunIfInputChangedAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Startup skill mining check failed; scheduler will retry at 02:00 Vietnam time.");
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var delay = GetDelayUntilNextRun();
                    _logger.LogInformation("Next Apriori/HUIM check in {Delay}.", delay);
                    await Task.Delay(delay, stoppingToken);
                    await RunIfInputChangedAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Scheduled skill mining check failed.");
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
            }

            _logger.LogInformation("Skill mining scheduler stopped.");
        }

        private TimeSpan GetDelayUntilNextRun()
        {
            var zone = GetVietnamTimeZone();
            var now = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, zone);
            var next = new DateTimeOffset(now.Year, now.Month, now.Day, 2, 0, 0, now.Offset);
            if (next <= now) next = next.AddDays(1);
            return next - now;
        }

        private async Task RunIfInputChangedAsync(CancellationToken token)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var discovery = scope.ServiceProvider.GetRequiredService<ISkillDiscoveryService>();
            var pendingSkills = await discovery.CollectAsync(token);
            if (pendingSkills > 0)
                _logger.LogInformation("There are {Count} skill candidates with independent evidence awaiting taxonomy review.", pendingSkills);
            var inferredDomains = scope.ServiceProvider.GetRequiredService<ICandidateCvDomainService>();
            var inferredCount = await inferredDomains.InferAndPersistAsync(token);
            if (inferredCount > 0) _logger.LogInformation("Updated {Count} CV domain classifications.", inferredCount);
            var fingerprint = await BuildInputFingerprintAsync(context, token);
            var previous = await ReadStateAsync(token);
            if (string.Equals(previous, fingerprint, StringComparison.Ordinal))
            {
                _logger.LogInformation("No new skill/CV/JD data detected. Skip Apriori/HUIM retraining.");
                return;
            }

            var apriori = await scope.ServiceProvider.GetRequiredService<IAprioriService>().TrainAprioriModelAsync();
            var huim = await scope.ServiceProvider.GetRequiredService<IHighUtilityService>().TrainHighUtilityModelAsync(100.0);
            if (apriori.IsSuccess && huim.IsSuccess)
            {
                await File.WriteAllTextAsync(_statePath,
                    JsonSerializer.Serialize(new { fingerprint, updatedAtUtc = DateTime.UtcNow }), Encoding.UTF8, token);
                _logger.LogInformation("Skill mining completed. Apriori: {Apriori}; HUIM: {Huim}.", apriori.Message, huim.Message);
            }
            else
            {
                _logger.LogWarning("Skill mining was not committed. Apriori={Apriori}; HUIM={Huim}.", apriori.Message, huim.Message);
            }
        }

        private static async Task<string> BuildInputFingerprintAsync(AppDbContext context, CancellationToken token)
        {
            var skills = await context.Skills.AsNoTracking().OrderBy(x => x.Id)
                .Select(x => $"skill:{x.Id}:{x.Name}:{x.IsApproved}").ToListAsync(token);
            var aliases = await context.SkillAliases.AsNoTracking().OrderBy(x => x.SkillAliasID)
                .Select(x => $"alias:{x.SkillAliasID}:{x.SkillID}:{x.Alias}:{x.NormalizedAlias}").ToListAsync(token);
            var cvs = await context.CandidateCVs.AsNoTracking().Where(x => x.CVExtractedSkills != null).OrderBy(x => x.CVID)
                .Select(x => $"cv:{x.CVID}:{x.CVExtractedSkills}").ToListAsync(token);
            var jobs = await context.JobPostings.AsNoTracking().Where(x => x.JDExtractedSkills != null).OrderBy(x => x.JobID)
                .Select(x => $"jd:{x.JobID}:{x.JDExtractedSkills}:{x.SalaryMax}").ToListAsync(token);
            var saved = await context.TalentPoolCandidates.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.TalentPoolCandidateID)
                .Select(x => $"pool:{x.TalentPoolCandidateID}:{x.LatestCVID}:{x.DomainJson}:{x.TargetPositionsJson}:{x.SourcingStage}:{x.TagsJson}").ToListAsync(token);
            var domains = await context.CandidateCvDomains.AsNoTracking()
                .OrderBy(x => x.CVID).ThenBy(x => x.Domain)
                .Select(x => $"domain:{x.CVID}:{x.Domain}:{x.Confidence}:{x.Source}:{x.EvidenceJson}:{x.IsConfirmed}")
                .ToListAsync(token);
            var source = string.Join("\n", skills.Concat(aliases).Concat(cvs).Concat(jobs).Concat(saved).Concat(domains));
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(source)));
        }

        private async Task<string?> ReadStateAsync(CancellationToken token)
        {
            if (!File.Exists(_statePath)) return null;
            try
            {
                await using var stream = File.OpenRead(_statePath);
                using var document = await JsonDocument.ParseAsync(stream, cancellationToken: token);
                return document.RootElement.TryGetProperty("fingerprint", out var value) ? value.GetString() : null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Cannot read skill mining state; next 02:00 run may rebuild it.");
                return null;
            }
        }

        private static TimeZoneInfo GetVietnamTimeZone()
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"); }
            catch (TimeZoneNotFoundException) { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh"); }
        }
    }
}
