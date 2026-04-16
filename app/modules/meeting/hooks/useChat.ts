import { useState, useCallback, useEffect, useRef } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import type { ChatMessage } from '../types';

/**
 * Manages in-room chat messaging via SignalR.
 *
 * @param connection — active SignalR hub connection
 * @param roomIdRef — ref to current room ID
 */
export function useChat(
  connection: HubConnection | null,
  roomIdRef: React.MutableRefObject<string | null>
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Ref for stable callback
  const connectionRef = useRef(connection);
  connectionRef.current = connection;

  const sendMessage = useCallback((message: string) => {
    const conn = connectionRef.current;
    if (!conn || !roomIdRef.current || !message.trim()) return;

    conn.invoke('SendMessage', roomIdRef.current, message.trim()).catch(err => {
      console.error('[Chat] Error sending message:', err);
    });
  }, [roomIdRef]);

  // Register ReceiveMessage event
  useEffect(() => {
    if (!connection) return;

    const handleMessage = (data: {
      messageId: string;
      connectionId: string;
      userId: string;
      fullName: string;
      message: string;
      timestamp: string;
    }) => {
      setMessages(prev => [...prev, {
        messageId: data.messageId,
        connectionId: data.connectionId,
        userId: data.userId,
        fullName: data.fullName,
        message: data.message,
        timestamp: data.timestamp
      }]);
    };

    connection.on('ReceiveMessage', handleMessage);
    return () => { connection.off('ReceiveMessage', handleMessage); };
  }, [connection]);

  return { messages, sendMessage };
}
