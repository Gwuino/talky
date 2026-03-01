'use client';

import ChannelSidebar from '@/components/navigation/ChannelSidebar';

export default function ServerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChannelSidebar />
      <div className="flex-1 flex min-w-0">
        {children}
      </div>
    </>
  );
}
