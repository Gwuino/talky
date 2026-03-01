'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useServerStore } from '@/stores/serverStore';
import { useVoiceStore } from '@/stores/voiceStore';
import { getSocket } from '@/lib/socket';
import { Hash, Volume2, Plus, Settings, Copy, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import UserPanel from './UserPanel';
import VoiceStatusBar from '@/components/media/VoiceStatusBar';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type VoiceUser = { userId: string; username: string };

export default function ChannelSidebar() {
  const { activeServer, channels, fetchServer, createChannel } = useServerStore();
  const connectedChannelId = useVoiceStore((s) => s.connectedChannelId);
  const params = useParams();
  const router = useRouter();
  const serverId = params?.serverId as string;
  const channelId = params?.channelId as string;
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [inviteCode, setInviteCode] = useState('');
  const [channelUsers, setChannelUsers] = useState<Record<string, VoiceUser[]>>({});

  useEffect(() => {
    if (serverId) fetchServer(serverId);
  }, [serverId, fetchServer]);

  // Fetch voice participants for all voice channels and listen for updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !channels.length) return;

    const voiceChannelIds = channels.filter((c) => c.type === 'VOICE').map((c) => c.id);
    if (voiceChannelIds.length === 0) return;

    // Request current voice users
    socket.emit('voice:get-channel-users', { channelIds: voiceChannelIds }, (data: Record<string, VoiceUser[]>) => {
      if (data) setChannelUsers(data);
    });

    // Listen for real-time updates
    const handleChannelUpdate = ({ channelId: chId, users }: { channelId: string; users: VoiceUser[] }) => {
      setChannelUsers((prev) => {
        const next = { ...prev };
        if (users.length > 0) {
          next[chId] = users;
        } else {
          delete next[chId];
        }
        return next;
      });
    };

    socket.on('voice:channel-update', handleChannelUpdate);
    return () => {
      socket.off('voice:channel-update', handleChannelUpdate);
    };
  }, [channels]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    const channel = await createChannel(serverId, newChannelName.trim(), newChannelType);
    setShowCreate(false);
    setNewChannelName('');
    if (channel.type === 'TEXT') {
      router.push(`/servers/${serverId}/channels/${channel.id}`);
    }
  };

  const handleGetInvite = async () => {
    try {
      const { data } = await api.get(`/servers/${serverId}/invite`);
      setInviteCode(data.inviteCode);
      setShowInvite(true);
    } catch {}
  };

  const textChannels = channels.filter((c) => c.type === 'TEXT');
  const voiceChannels = channels.filter((c) => c.type === 'VOICE');

  return (
    <div className="w-60 bg-bg-secondary flex flex-col shrink-0">
      {/* Server name header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-border/50 shadow-sm">
        <h2 className="font-semibold text-text-primary truncate">{activeServer?.name || 'Server'}</h2>
        <button onClick={handleGetInvite} className="text-text-secondary hover:text-text-primary">
          <Settings size={18} />
        </button>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto px-2 pt-4 space-y-4">
        {/* Text channels */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-xs font-semibold uppercase text-text-muted flex items-center gap-1">
              <ChevronDown size={12} /> Text Channels
            </span>
            <button onClick={() => { setNewChannelType('TEXT'); setShowCreate(true); }} className="text-text-muted hover:text-text-primary">
              <Plus size={16} />
            </button>
          </div>
          {textChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => router.push(`/servers/${serverId}/channels/${channel.id}`)}
              className={cn(
                'w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm transition-colors',
                channelId === channel.id
                  ? 'bg-bg-active text-text-primary'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              )}
            >
              <Hash size={18} className="shrink-0 text-text-muted" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>

        {/* Voice channels */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-xs font-semibold uppercase text-text-muted flex items-center gap-1">
              <ChevronDown size={12} /> Voice Channels
            </span>
            <button onClick={() => { setNewChannelType('VOICE'); setShowCreate(true); }} className="text-text-muted hover:text-text-primary">
              <Plus size={16} />
            </button>
          </div>
          {voiceChannels.map((channel) => {
            const users = channelUsers[channel.id] || [];
            return (
              <div key={channel.id}>
                <button
                  onClick={() => router.push(`/servers/${serverId}/channels/${channel.id}`)}
                  className={cn(
                    'w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm transition-colors',
                    channelId === channel.id
                      ? 'bg-bg-active text-text-primary'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
                    connectedChannelId === channel.id && 'text-success'
                  )}
                >
                  <Volume2 size={18} className="shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </button>
                {/* Voice channel participants */}
                {users.length > 0 && (
                  <div className="ml-4 pl-3 border-l border-border/30 space-y-0.5 py-0.5">
                    {users.map((user) => (
                      <div key={user.userId} className="flex items-center gap-2 px-2 py-1 text-xs text-text-secondary">
                        <Avatar name={user.username} size="sm" className="!w-5 !h-5 !text-[8px]" />
                        <span className="truncate">{user.username}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Voice status bar */}
      {connectedChannelId && <VoiceStatusBar />}

      {/* User panel */}
      <UserPanel />

      {/* Create Channel Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Channel">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-text-secondary mb-2 block">Channel Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewChannelType('TEXT')}
                className={cn('flex-1 p-3 rounded border text-sm', newChannelType === 'TEXT' ? 'border-accent bg-accent/10' : 'border-border')}
              >
                <Hash size={20} className="mx-auto mb-1" /> Text
              </button>
              <button
                type="button"
                onClick={() => setNewChannelType('VOICE')}
                className={cn('flex-1 p-3 rounded border text-sm', newChannelType === 'VOICE' ? 'border-accent bg-accent/10' : 'border-border')}
              >
                <Volume2 size={20} className="mx-auto mb-1" /> Voice
              </button>
            </div>
          </div>
          <Input
            label="Channel Name"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="new-channel"
            autoFocus
          />
          <Button type="submit" className="w-full">Create Channel</Button>
        </form>
      </Modal>

      {/* Invite Modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite People">
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Share this invite code with friends:</p>
          <div className="flex gap-2">
            <Input value={inviteCode} readOnly className="font-mono text-sm" />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(inviteCode);
                toast.success('Copied!');
              }}
              variant="secondary"
            >
              <Copy size={18} />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
