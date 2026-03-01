export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status?: 'ONLINE' | 'IDLE' | 'DND' | 'OFFLINE';
  createdAt?: string;
}

export interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
  inviteCode?: string;
  ownerId: string;
  channels?: Channel[];
  members?: ServerMember[];
}

export interface ServerMember {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  userId: string;
  serverId: string;
  user: User;
}

export interface Channel {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE';
  position: number;
  serverId: string;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  channelId: string;
  editedAt: string | null;
  createdAt: string;
  user: User;
}

export interface DirectMessage {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: string;
  sender: User;
}

export interface DMConversation {
  id: string;
  createdAt: string;
  otherUser?: User;
  lastMessage?: DirectMessage | null;
  participants: { userId: string; user: User }[];
}

export interface VoicePeer {
  userId: string;
  username?: string;
  muted: boolean;
  deafened: boolean;
}
