import { useEffect, useState } from 'react';

type PresencePayload = {
  count: number;
};

export function useOnlineLearners() {
  const [onlineLearners, setOnlineLearners] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/presence/stream');

    function handlePresence(event: MessageEvent<string>) {
      const payload = JSON.parse(event.data) as PresencePayload;
      setOnlineLearners(payload.count);
      setConnected(true);
    }

    function handleError() {
      setConnected(false);
    }

    eventSource.addEventListener('presence', handlePresence as EventListener);
    eventSource.onerror = handleError;

    return () => {
      eventSource.removeEventListener('presence', handlePresence as EventListener);
      eventSource.close();
    };
  }, []);

  return {
    onlineLearners,
    connected,
  };
}
