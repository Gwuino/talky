// Socket event name constants
export const EVENTS = {
  // Channel
  CHANNEL_JOIN: 'channel:join',
  CHANNEL_LEAVE: 'channel:leave',
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  TYPING_UPDATE: 'typing:update',

  // DM
  DM_JOIN: 'dm:join',
  DM_LEAVE: 'dm:leave',
  DM_SEND: 'dm:send',
  DM_NEW: 'dm:new',
  DM_TYPING: 'dm:typing',
  DM_TYPING_UPDATE: 'dm:typing-update',

  // Presence
  SERVER_JOIN_ROOM: 'server:join-room',
  SERVER_LEAVE_ROOM: 'server:leave-room',
  PRESENCE_ONLINE_USERS: 'presence:online-users',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  // Voice
  VOICE_JOIN: 'voice:join',
  VOICE_LEAVE: 'voice:leave',
  VOICE_MUTE: 'voice:mute',
  VOICE_DEAFEN: 'voice:deafen',
  VOICE_PARTICIPANTS: 'voice:participants',
  VOICE_USER_JOINED: 'voice:user-joined',
  VOICE_USER_LEFT: 'voice:user-left',
  VOICE_STATE_UPDATE: 'voice:state-update',

  // WebRTC signaling
  RTC_OFFER: 'rtc:offer',
  RTC_ANSWER: 'rtc:answer',
  RTC_ICE_CANDIDATE: 'rtc:ice-candidate',

  // Call
  CALL_INITIATE: 'call:initiate',
  CALL_INCOMING: 'call:incoming',
  CALL_ACCEPT: 'call:accept',
  CALL_REJECT: 'call:reject',
  CALL_END: 'call:end',
  CALL_RINGING: 'call:ringing',
  CALL_ACCEPTED: 'call:accepted',
  CALL_REJECTED: 'call:rejected',
  CALL_ENDED: 'call:ended',

  // Error
  ERROR: 'error',
} as const;
