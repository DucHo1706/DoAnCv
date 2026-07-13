using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RecruitmentBackend.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class MiningSchedulerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MiningSchedulerService> _logger;

        public MiningSchedulerService(IServiceProvider serviceProvider, ILogger<MiningSchedulerService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Background Mining Scheduler Service has started.");

            // Delay initial execution by 30 seconds to allow the main application to start completely
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Automatically retraining data mining models (Apriori & HUIM) in the background...");

                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var aprioriService = scope.ServiceProvider.GetRequiredService<IAprioriService>();
                        var highUtilityService = scope.ServiceProvider.GetRequiredService<IHighUtilityService>();

                        // 1. Train Apriori Skill Association Rules
                        var aprioriResult = await aprioriService.TrainAprioriModelAsync();
                        if (aprioriResult.IsSuccess)
                        {
                            _logger.LogInformation("Apriori model automatically updated in background: {Message}", aprioriResult.Message);
                        }
                        else
                        {
                            _logger.LogWarning("Apriori background auto-update failed: {Message}", aprioriResult.Message);
                        }

                        // 2. Train HUIM High-Utility Skill sets
                        var huimResult = await highUtilityService.TrainHighUtilityModelAsync(100.0);
                        if (huimResult.IsSuccess)
                        {
                            _logger.LogInformation("HUIM model automatically updated in background: {Message}", huimResult.Message);
                        }
                        else
                        {
                            _logger.LogWarning("HUIM background auto-update failed: {Message}", huimResult.Message);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred while automatically retraining data mining models in background.");
                }

                // Retrain periodically every 12 hours
                await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
            }

            _logger.LogInformation("Background Mining Scheduler Service has stopped.");
        }
    }
}
