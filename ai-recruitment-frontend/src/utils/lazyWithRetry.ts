import { lazy, type ComponentType } from "react";

type LazyModule<T extends ComponentType<object>> = { default: T };

const CHUNK_ERROR_PATTERN =
  /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i;

export function lazyWithRetry<T extends ComponentType<object>>(
  importer: () => Promise<LazyModule<T>>,
  componentKey?: string
) {
  return lazy(async () => {
    const retryKey = `lazy-chunk-retry:${componentKey || window.location.pathname}`;

    try {
      const module = await importer();
      sessionStorage.removeItem(retryKey);
      return module;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const hasRetried = sessionStorage.getItem(retryKey) === "1";

      if (CHUNK_ERROR_PATTERN.test(errorMessage) && !hasRetried) {
        sessionStorage.setItem(retryKey, "1");
        window.location.reload();

        // Giữ Suspense ở trạng thái chờ trong lúc trình duyệt tải lại tài liệu mới.
        return new Promise<LazyModule<T>>(() => undefined);
      }

      throw error;
    }
  });
}
