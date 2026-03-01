'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useServerStore } from '@/stores/serverStore';
import { useMessageStore } from '@/stores/messageStore';
import { useVoiceStore } from '@/stores/voiceStore';
import { useVoice } from '@/hooks/useVoice';
import { getSocket } from '@/lib/socket';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import MemberList from '@/components/members/MemberList';
import MediaControls from '@/components/media/MediaControls';
import Avatar from '@/components/ui/Avatar';
import type { Message, VoicePeer } from '@/types';

export default function ChannelPage() {
  const params = useParams();
  const channelId = params?.channelId as string;
  const serverId = params?.serverId as string;

  const channels = useServerStore((s) => s.channels);
  const members = useServerStore((s) => s.members);
  const { messages, hasMore, isLoading, fetchMessages, loadMore, addMessage } = useMessageStore();
  const { connectedChannelId, peers, setPeers, addPeer, removePeer, updatePeer } = useVoiceStore();
  const [showMembers, setShowMembers] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const channel = channels.find((c) => c.id === channelId);
  const isTextChannel = channel?.type === 'TEXT';
  const isVoiceChannel = channel?.type === 'VOICE';
  const isConnectedToThisVoice = connectedChannelId === channelId;

  // Voice hook
  const { remoteStreams, joinVoice, leaveVoice } = useVoice(channelId);

  // Refs for remote audio elements
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Attach remote audio streams
  useEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      let audio = audioRefs.current.get(userId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audioRefs.current.set(userId, audio);
      }
      if (audio.srcObject !== stream) {
        audio.srcObject = stream;
      }
    });

    // Cleanup removed streams
    audioRefs.current.forEach((audio, userId) => {
      if (!remoteStreams.has(userId)) {
        audio.srcObject = null;
        audioRefs.current.delete(userId);
      }
    });
  }, [remoteStreams]);

  // Socket events for chat
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !channelId) return;

    if (isTextChannel) {
      fetchMessages(channelId);
      socket.emit('channel:join', { channelId });

      const handleNewMessage = (message: Message) => {
        if (message.channelId === channelId) {
          addMessage(message);
        }
      };

      socket.on('message:new', handleNewMessage);

      return () => {
        socket.emit('channel:leave', { channelId });
        socket.off('message:new', handleNewMessage);
      };
    }
  }, [channelId, isTextChannel, fetchMessages, addMessage]);

  // Socket events for presence
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('server:join-room', { serverId });

    socket.on('presence:online-users', ({ userIds }: { userIds: string[] }) => {
      setOnlineUserIds(new Set(userIds));
    });
    socket.on('user:online', ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => new Set([...prev, userId]));
    });
    socket.on('user:offline', ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.emit('server:leave-room', { serverId });
      socket.off('presence:online-users');
      socket.off('user:online');
      socket.off('user:offline');
    };
  }, [serverId]);

  // Voice channel events
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isVoiceChannel) return;

    socket.on('voice:participants', ({ participants }: { participants: VoicePeer[] }) => {
      setPeers(participants);
    });
    socket.on('voice:user-joined', ({ userId, username }: { userId: string; username: string }) => {
      addPeer({ userId, username, muted: false, deafened: false });
    });
    socket.on('voice:user-left', ({ userId }: { userId: string }) => {
      removePeer(userId);
    });
    socket.on('voice:state-update', ({ userId, muted, deafened }: { userId: string; muted: boolean; deafened: boolean }) => {
      updatePeer(userId, { muted, deafened });
    });

    return () => {
      socket.off('voice:participants');
      socket.off('voice:user-joined');
      socket.off('voice:user-left');
      socket.off('voice:state-update');
    };
  }, [isVoiceChannel, setPeers, addPeer, removePeer, updatePeer]);

  const handleSend = useCallback((content: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('message:send', { channelId, content });
  }, [channelId]);

  const handleTypingStart = useCallback(() => {
    getSocket()?.emit('typing:start', { channelId });
  }, [channelId]);

  const handleTypingStop = useCallback(() => {
    getSocket()?.emit('typing:stop', { channelId });
  }, [channelId]);

  const handleJoinVoice = async () => {
    await joinVoice();
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-primary min-w-0">
      <ChatHeader
        channel={channel}
        showMembers={showMembers}
        onToggleMembers={() => setShowMembers(!showMembers)}
      />

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          {isTextChannel && (
            <>
              <MessageList
                messages={messages}
                hasMore={hasMore}
                isLoading={isLoading}
                onLoadMore={() => loadMore(channelId)}
              />
              <MessageInput
                onSend={handleSend}
                onTypingStart={handleTypingStart}
                onTypingStop={handleTypingStop}
                placeholder={`Message #${channel?.name || ''}`}
              />
            </>
          )}

          {isVoiceChannel && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              {!isConnectedToThisVoice ? (
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-text-primary mb-2">{channel?.name}</h3>
                  {peers.length > 0 ? (
                    <p className="text-text-secondary mb-4">{peers.length} user{peers.length !== 1 ? 's' : ''} in channel</p>
                  ) : (
                    <p className="text-text-secondary mb-4">No one is currently in this voice channel</p>
                  )}
                  {peers.length > 0 && (
                    <div className="flex justify-center gap-2 mb-6">
                      {peers.map((peer) => (
                        <div key={peer.userId} className="flex items-center gap-1 text-sm text-text-muted">
                          <Avatar name={peer.username || peer.userId} size="sm" />
                          <span>{peer.username}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleJoinVoice}
                    className="px-6 py-3 bg-success hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Join Voice
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-2xl">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                    {peers.map((peer) => (
                      <div key={peer.userId} className="flex flex-col items-center gap-2 p-4 bg-bg-secondary rounded-lg">
                        <div className="relative">
                          <Avatar name={peer.username || peer.userId} size="lg" />
                          {!peer.muted && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-text-primary font-medium">{peer.username || 'User'}</p>
                        <div className="flex gap-1 text-xs text-text-muted">
                          {peer.muted && <span className="text-danger">Muted</span>}
                          {peer.deafened && <span className="text-danger">Deafened</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <MediaControls channelId={channelId} />
                </div>
              )}
            </div>
          )}
        </div>

        {showMembers && (
          <MemberList members={members} onlineUserIds={onlineUserIds} />
        )}
      </div>
    </div>
  );
}
