'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  placeholder?: string;
}

export default function MessageInput({ onSend, onTypingStart, onTypingStop, placeholder = 'Message...' }: MessageInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Typing indicator
    if (onTypingStart) onTypingStart();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      if (onTypingStop) onTypingStop();
    }, 2000);

    // Auto-resize
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setContent('');
    if (onTypingStop) onTypingStop();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pb-4">
      <div className="flex items-end gap-2 bg-bg-input rounded-lg px-4 py-2.5">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted resize-none text-sm max-h-[200px] outline-none"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="text-text-muted hover:text-accent disabled:opacity-30 transition-colors shrink-0 pb-0.5"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
