import { useEffect, useState } from 'react';

type PresencePayload = {
  count: number;
};

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export function useOnlineLearners(isAuthenticated = false) {
  const [onlineLearners, setOnlineLearners] = useState(0);
  const [connected, setConnected] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setOnlineLearners(0);
      setConnected(false);
      setFailed(false);
      return;
    }

    let active = true;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let eventSource: EventSource | null = null;

    function cleanupEventSource() {
      if (!eventSource) {
        return;
      }

      eventSource.close();
      eventSource = null;
    }

    function scheduleReconnect() {
      if (!active || retryCount >= MAX_RETRIES) {
        setFailed(true);
        return;
      }

      retryCount += 1;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connect();
      }, RETRY_DELAY_MS);
    }

    function connect() {
      cleanupEventSource();

      eventSource = new EventSource('/api/presence/stream');

      eventSource.addEventListener('presence', (event) => {
        const payload = JSON.parse((event as MessageEvent<string>).data) as PresencePayload;
        setOnlineLearners(payload.count);
        setConnected(true);
        setFailed(false);
        retryCount = 0;
      });

      eventSource.onerror = () => {
        cleanupEventSource();
        setConnected(false);
        scheduleReconnect();
      };
    }

    connect();

    return () => {
      active = false;
      cleanupEventSource();
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [isAuthenticated]);

  return {
    onlineLearners,
    connected,
    failed,
  };
}
