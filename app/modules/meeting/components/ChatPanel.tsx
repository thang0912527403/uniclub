import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isOpen,
  onClose,
  currentUserId
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 bottom-24 w-80 h-[500px] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-orange-500/20 to-amber-500/20">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-white font-semibold">Tin nhắn</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">Chưa có tin nhắn nào</p>
            <p className="text-xs">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.userId === currentUserId;
            return (
              <div
                key={msg.messageId}
                className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
              >
                {!isOwnMessage && (
                  <span className="text-xs text-gray-400 mb-1 ml-1">{msg.fullName}</span>
                )}
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl ${
                    isOwnMessage
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-md'
                      : 'bg-white/10 text-white rounded-bl-md'
                  }`}
                >
                  <p className="text-sm break-words">{msg.message}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1 mx-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-white/10 text-white placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-white/10"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-2.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
