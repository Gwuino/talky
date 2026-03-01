'use client';

import { useEffect } from 'react';
import { useFriendStore } from '@/stores/friendStore';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FriendRequests() {
  const { incomingRequests, outgoingRequests, fetchRequests, acceptRequest, declineRequest } = useFriendStore();

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (id: string) => {
    try {
      await acceptRequest(id);
      toast.success('Friend request accepted!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await declineRequest(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to decline');
    }
  };

  return (
    <div className="p-4">
      {incomingRequests.length > 0 && (
        <>
          <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">
            Incoming — {incomingRequests.length}
          </h3>
          <div className="space-y-1 mb-6">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 px-3 py-2 rounded hover:bg-bg-hover"
              >
                <Avatar src={req.sender.avatarUrl} name={req.sender.displayName} size="sm" status={req.sender.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{req.sender.displayName}</p>
                  <p className="text-xs text-text-muted">{req.sender.username}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-success/20 text-success hover:bg-success/30 transition-colors"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={() => handleDecline(req.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-danger/20 text-danger hover:bg-danger/30 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {outgoingRequests.length > 0 && (
        <>
          <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">
            Outgoing — {outgoingRequests.length}
          </h3>
          <div className="space-y-1">
            {outgoingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 px-3 py-2 rounded hover:bg-bg-hover"
              >
                <Avatar src={req.receiver.avatarUrl} name={req.receiver.displayName} size="sm" status={req.receiver.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{req.receiver.displayName}</p>
                  <p className="text-xs text-text-muted">{req.receiver.username}</p>
                </div>
                <span className="text-xs text-text-muted">Pending</span>
              </div>
            ))}
          </div>
        </>
      )}

      {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
        <p className="text-sm text-text-muted text-center py-12">No pending friend requests.</p>
      )}
    </div>
  );
}
