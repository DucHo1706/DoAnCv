import { useEffect, useRef } from "react";

export const REALTIME_RESOURCE_EVENT = "recruitment:resource-changed";
export const REALTIME_NOTIFICATION_EVENT = "recruitment:notification";

export interface RealtimeResourceEventDetail {
  resource?: string;
  action?: string;
  applicationId?: string;
  jobId?: string;
  aiStatus?: string;
  changedAt?: string;
}

export interface RealtimeNotificationEventDetail {
  id?: string;
  title?: string;
  content?: string;
  redirectUrl?: string;
  createdAt?: string;
}

function useDebouncedWindowEvent<T>(
  eventName: string,
  callback: (detail: T) => void | Promise<void>,
  accepts: (detail: T) => boolean,
  delayMs: number,
) {
  const callbackRef = useRef(callback);
  const acceptsRef = useRef(accepts);

  useEffect(() => {
    callbackRef.current = callback;
    acceptsRef.current = accepts;
  }, [callback, accepts]);

  useEffect(() => {
    let timeoutId: number | undefined;
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<T>).detail;
      if (!acceptsRef.current(detail)) return;
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        void callbackRef.current(detail);
      }, delayMs);
    };

    window.addEventListener(eventName, listener);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(eventName, listener);
    };
  }, [delayMs, eventName]);
}

export function useRealtimeResourceRefresh(
  resources: string[],
  callback: (detail: RealtimeResourceEventDetail) => void | Promise<void>,
  delayMs = 250,
) {
  const resourceKey = [...resources].sort().join("|");
  const acceptedResources = resourceKey.split("|").filter(Boolean);
  useDebouncedWindowEvent<RealtimeResourceEventDetail>(
    REALTIME_RESOURCE_EVENT,
    callback,
    (detail) => Boolean(detail?.resource && acceptedResources.includes(detail.resource)),
    delayMs,
  );
}

export function useRealtimeNotificationRefresh(
  callback: (detail: RealtimeNotificationEventDetail) => void | Promise<void>,
  accepts: (detail: RealtimeNotificationEventDetail) => boolean,
  delayMs = 250,
) {
  useDebouncedWindowEvent(REALTIME_NOTIFICATION_EVENT, callback, accepts, delayMs);
}
