'use client';

import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'ONLINE' | 'IDLE' | 'DND' | 'OFFLINE';
  className?: string;
}

const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-20 h-20 text-2xl' };
const statusColors = {
  ONLINE: 'bg-success',
  IDLE: 'bg-warning',
  DND: 'bg-danger',
  OFFLINE: 'bg-text-muted',
};

export default function Avatar({ src, name, size = 'md', status, className }: AvatarProps) {
  const initials = name.slice(0, 2).toUpperCase();
  const bgColor = `hsl(${name.charCodeAt(0) * 7 % 360}, 60%, 45%)`;

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img src={src} alt={name} className={cn('rounded-full object-cover', sizeMap[size])} />
      ) : (
        <div
          className={cn('rounded-full flex items-center justify-center font-semibold text-white', sizeMap[size])}
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-bg-secondary',
            statusColors[status],
            size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
          )}
        />
      )}
    </div>
  );
}
