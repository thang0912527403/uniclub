import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { getAccessToken } from '~/utils/auth';
import type { RecordOfChange } from '~/cores/api/types/recordOfChange';

interface UseRecordOfChangeSignalROptions {
  clubId?: number | string;
  onNewRecord?: (record: RecordOfChange) => void;
}

export function useRecordOfChangeSignalR({
  clubId,
  onNewRecord,
}: UseRecordOfChangeSignalROptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const onNewRecordRef = useRef(onNewRecord);
  // Chỉ connection nào được gán vào activeRef mới được phép cập nhật state.
  // React Strict Mode sẽ set ref=null (cleanup) rồi ref=conn2 (mount 2),
  // nên conn1.onclose không thể ghi đè setIsConnected(true) của conn2.
  const activeRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    onNewRecordRef.current = onNewRecord;
  }, [onNewRecord]);

  useEffect(() => {
    const token = getAccessToken();
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://localhost:7237';

    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${backendUrl}/record-of-change`, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    activeRef.current = connection;

    connection.on('ReceiveRecordOfChange', (record: RecordOfChange) => {
      onNewRecordRef.current?.(record);
    });

    connection.onclose(() => {
      // Chỉ set false nếu đây vẫn còn là connection active
      if (activeRef.current === connection) {
        setIsConnected(false);
      }
    });

    connection.onreconnected(() => {
      if (activeRef.current === connection) {
        setIsConnected(true);
      }
    });

    let cleanupCalled = false;

    connection
      .start()
      .then(async () => {
        if (cleanupCalled) {
          connection.stop().catch(() => {});
          return;
        }
        // Chỉ set connected nếu đây vẫn là connection active (tránh Strict Mode race)
        if (activeRef.current !== connection) return;
        setIsConnected(true);
        if (clubId !== undefined && clubId !== '') {
          await connection.invoke('JoinClubGroup', String(clubId)).catch(() => {});
        } else {
          await connection.invoke('JoinAllGroup').catch(() => {});
        }
      })
      .catch((err) => {
        if (!cleanupCalled) console.error('RecordOfChange SignalR error:', err);
      });

    return () => {
      cleanupCalled = true;
      activeRef.current = null;
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isConnected };
}
