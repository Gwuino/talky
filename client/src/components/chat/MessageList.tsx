'use client';

import { useRef, useEffect, useCallback } from 'react';
import MessageItem from './MessageItem';
import type { Message, DirectMessage } from '@/types';

interface MessageListProps {
  messages: (Message | DirectMessage)[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export default function MessageList({ messages, hasMore, isLoading, onLoadMore }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (shouldAutoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    // Auto-scroll if near bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScroll.current = distanceFromBottom < 100;

    // Load more when scrolled to top
    if (container.scrollTop < 50 && hasMore && !isLoading) {
      const oldHeight = container.scrollHeight;
      onLoadMore();
      // Maintain scroll position after loading
      requestAnimationFrame(() => {
        const newHeight = container.scrollHeight;
        container.scrollTop = newHeight - oldHeight;
      });
    }
  };

  const getMessageUser = (msg: Message | DirectMessage) => {
    if ('user' in msg) return msg.user;
    if ('sender' in msg) return msg.sender;
    return { id: '', username: '', displayName: 'Unknown', avatarUrl: null };
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      onScroll={handleScroll}
    >
      {isLoading && messages.length === 0 && (
        <div className="py-2 px-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-bg-hover shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2 items-center">
                  <div className="h-3.5 w-24 bg-bg-hover rounded" />
                  <div className="h-3 w-16 bg-bg-hover/50 rounded" />
                </div>
                <div className="h-3.5 bg-bg-hover rounded" style={{ width: `${40 + Math.random() * 50}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading && messages.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <p className="text-text-secondary font-medium">No messages yet</p>
          <p className="text-text-muted text-sm">Be the first to send a message!</p>
        </div>
      )}

      {!hasMore && messages.length > 0 && (
        <div className="px-4 py-6 border-b border-border/30">
          <p className="text-text-muted text-sm">This is the beginning of the conversation.</p>
        </div>
      )}

      <div className="py-2">
        {messages.map((msg, i) => {
          const user = getMessageUser(msg);
          const prevMsg = i > 0 ? messages[i - 1] : null;
          const prevUser = prevMsg ? getMessageUser(prevMsg) : null;
          const showHeader =
            !prevMsg ||
            prevUser?.id !== user.id ||
            new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60 * 1000;

          return (
            <MessageItem
              key={msg.id}
              id={msg.id}
              content={msg.content}
              createdAt={msg.createdAt}
              editedAt={'editedAt' in msg ? msg.editedAt : null}
              user={user}
              showHeader={showHeader}
            />
          );
        })}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
