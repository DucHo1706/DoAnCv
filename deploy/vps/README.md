# VPS operations

These scripts are designed for `/opt/recruitment/app`. Override `PROJECT_DIR` when the repository is elsewhere.

## First deployment

1. Copy `.env.example` to `.env` and keep the existing production credentials if rotating them is deferred.
2. Set `UPLOADS_PATH=/opt/recruitment/data/uploads`.
3. Run `bash deploy/vps/bootstrap-certificate.sh your-email@example.com` only when the certificate does not exist.
4. Run `bash deploy/vps/deploy.sh`.

The deploy script validates Compose, preserves the current images with the `rollback` tag, builds without stopping the running stack, waits for health checks, and restores the previous images if activation fails.

## Scheduled operations

Example root crontab entries:

```cron
0 2 * * * PROJECT_DIR=/opt/recruitment/app UPLOADS_PATH=/opt/recruitment/data/uploads /bin/bash /opt/recruitment/app/deploy/vps/backup.sh >> /var/log/recruitment-backup.log 2>&1
*/5 * * * * PROJECT_DIR=/opt/recruitment/app /bin/bash /opt/recruitment/app/deploy/vps/health-check.sh >> /var/log/recruitment-health.log 2>&1
15 3 * * 1 PROJECT_DIR=/opt/recruitment/app /bin/bash /opt/recruitment/app/deploy/vps/renew-certificate.sh >> /var/log/recruitment-certbot.log 2>&1
```

Database backups are not included because SQL Server is hosted externally. Enable automated backups at that database provider.
