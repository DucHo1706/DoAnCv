export type JobLifecycleStatus =
  | "Recruiting"
  | "Scheduled"
  | "Expired"
  | "Pending"
  | "Rejected"
  | "Closed"
  | "Archived"
  | "Flagged"
  | string;

export interface JobLifecycleSource {
  status?: string | null;
  startDate?: string | null;
  deadline?: string | null;
  lifecycleStatus?: JobLifecycleStatus | null;
  isRecruiting?: boolean;
  isExpired?: boolean;
}

function getVietnamDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getJobDateKey(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const hasExplicitTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  if (!hasExplicitTimeZone && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : getVietnamDateKey(parsed);
}

export function resolveJobLifecycle(job: JobLifecycleSource): JobLifecycleStatus {
  if (job.lifecycleStatus) return job.lifecycleStatus;

  const status = job.status || "";
  if (status === "Pending" || status === "Rejected" || status === "Archived" || status === "Flagged") {
    return status;
  }

  const today = getVietnamDateKey(new Date());
  const deadline = getJobDateKey(job.deadline);
  const startDate = getJobDateKey(job.startDate);
  if ((status === "Published" || status === "Closed" || status === "Locked") && deadline && deadline < today) {
    return "Expired";
  }
  if (status === "Closed" || status === "Locked") return "Closed";
  if (status === "Published" && startDate && startDate > today) return "Scheduled";
  if (status === "Published") return "Recruiting";
  return status;
}

export function formatJobDate(value?: string | null): string {
  if (!value) return "Chưa cập nhật";
  const dateKey = getJobDateKey(value);
  if (!dateKey) return value;
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}
