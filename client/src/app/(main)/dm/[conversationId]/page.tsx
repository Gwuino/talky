'use client';

import { useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useDMStore } from '@/stores/dmStore';
import { useAuthStore } from '@/stores/authStore';
import { useCall } from '@/hooks/useCall';
import { getSocket } from '@/lib/socket';
import DMSidebar from '@/components/navigation/DMSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import type { DirectMessage } from '@/types';

export default function DMConversationPage() {
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const userId = useAuthStore((s) => s.user?.id);
  const { conversations, messages, hasMore, isLoading, fetchMessages, loadMore, addMessage } = useDMStore();
  const { initiateCall } = useCall();

  const conversation = conversations.find((c) => c.id === conversationId);
  const otherUser = conversation?.otherUser || conversation?.participants.find((p) => p.userId !== userId)?.user;

  useEffect(() => {
    if (!conversationId) return;
    fetchMessages(conversationId);

    const socket = getSocket();
    if (!socket) return;

    socket.emit('dm:join', { conversationId });

    const handleNewDM = ({ message }: { message: DirectMessage }) => {
      addMessage(message);
    };

    socket.on('dm:new', handleNewDM);

    return () => {
      socket.emit('dm:leave', { conversationId });
      socket.off('dm:new', handleNewDM);
    };
  }, [conversationId, fetchMessages, addMessage]);

  const handleSend = useCallback((content: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('dm:send', { conversationId, content });
  }, [conversationId]);

  const handleCall = () => {
    if (!otherUser) return;
    initiateCall(otherUser.id, 'audio');
  };

  const handleVideoCall = () => {
    if (!otherUser) return;
    initiateCall(otherUser.id, 'video');
  };

  return (
    <>
      <DMSidebar />
      <div className="flex-1 flex flex-col bg-bg-primary min-w-0">
        <ChatHeader
          title={otherUser?.displayName || 'Direct Message'}
          onCall={handleCall}
        />
        <MessageList
          messages={messages}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={() => loadMore(conversationId)}
        />
        <MessageInput
          onSend={handleSend}
          placeholder={`Message @${otherUser?.displayName || 'user'}`}
        />
      </div>
    </>
  );
}
