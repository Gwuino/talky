'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useServerStore } from '@/stores/serverStore';

export default function ServerPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params?.serverId as string;
  const channels = useServerStore((s) => s.channels);

  useEffect(() => {
    const firstTextChannel = channels.find((c) => c.type === 'TEXT');
    if (firstTextChannel) {
      router.replace(`/servers/${serverId}/channels/${firstTextChannel.id}`);
    }
  }, [channels, serverId, router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-bg-primary">
      <p className="text-text-secondary">Select a channel</p>
    </div>
  );
}
