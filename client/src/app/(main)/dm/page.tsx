'use client';

import DMSidebar from '@/components/navigation/DMSidebar';

export default function DMPage() {
  return (
    <>
      <DMSidebar />
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Your Messages</h2>
          <p className="text-text-secondary">Select a conversation or start a new one</p>
        </div>
      </div>
    </>
  );
}
