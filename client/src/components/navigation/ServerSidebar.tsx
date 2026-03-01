'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useServerStore } from '@/stores/serverStore';
import { MessageCircle, Plus, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ServerSidebar() {
  const { servers, fetchServers, createServer, joinServer } = useServerStore();
  const router = useRouter();
  const params = useParams();
  const activeServerId = params?.serverId as string;
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const server = await createServer(newName.trim());
    setShowCreate(false);
    setNewName('');
    router.push(`/servers/${server.id}`);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    try {
      const server = await joinServer(inviteCode.trim());
      setShowJoin(false);
      setInviteCode('');
      router.push(`/servers/${server.id}`);
    } catch { toast.error('Invalid invite code'); }
  };

  return (
    <div className="w-[72px] bg-bg-tertiary flex flex-col items-center py-3 gap-2 overflow-y-auto shrink-0">
      {/* DM Button */}
      <button
        onClick={() => router.push('/dm')}
        className={cn(
          'w-12 h-12 rounded-2xl bg-bg-primary flex items-center justify-center transition-all hover:rounded-xl hover:bg-accent',
          !activeServerId && 'bg-accent rounded-xl'
        )}
      >
        <MessageCircle size={24} className="text-text-primary" />
      </button>

      <div className="w-8 h-0.5 bg-border rounded-full" />

      {/* Server list */}
      {servers.map((server) => (
        <button
          key={server.id}
          onClick={() => router.push(`/servers/${server.id}`)}
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:rounded-xl text-white font-semibold text-sm',
            activeServerId === server.id ? 'rounded-xl bg-accent' : 'bg-bg-primary hover:bg-accent'
          )}
          title={server.name}
          style={
            !server.iconUrl && activeServerId !== server.id
              ? { backgroundColor: `hsl(${server.name.charCodeAt(0) * 7 % 360}, 50%, 40%)` }
              : undefined
          }
        >
          {server.iconUrl ? (
            <img src={server.iconUrl} alt={server.name} className="w-12 h-12 rounded-2xl object-cover" />
          ) : (
            server.name.slice(0, 2).toUpperCase()
          )}
        </button>
      ))}

      {/* Add server */}
      <button
        onClick={() => setShowCreate(true)}
        className="w-12 h-12 rounded-2xl bg-bg-primary flex items-center justify-center transition-all hover:rounded-xl hover:bg-success text-success hover:text-white"
      >
        <Plus size={24} />
      </button>

      {/* Join server */}
      <button
        onClick={() => setShowJoin(true)}
        className="w-12 h-12 rounded-2xl bg-bg-primary flex items-center justify-center transition-all hover:rounded-xl hover:bg-success text-success hover:text-white"
      >
        <LogIn size={24} />
      </button>

      {/* Create Server Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create a Server">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Server Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="My Awesome Server"
            autoFocus
          />
          <Button type="submit" className="w-full">Create</Button>
        </form>
      </Modal>

      {/* Join Server Modal */}
      <Modal isOpen={showJoin} onClose={() => setShowJoin(false)} title="Join a Server">
        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            label="Invite Code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter invite code"
            autoFocus
          />
          <Button type="submit" className="w-full">Join</Button>
        </form>
      </Modal>
    </div>
  );
}
