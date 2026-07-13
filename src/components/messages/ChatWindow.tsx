'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Check, CheckCheck, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import {
  useMarkThreadRead,
  useMessageThread,
  usePingTyping,
  useSendMessage,
  useTypingIndicator,
} from '@/hooks/useMessages';
import { timeAgo } from '@/lib/time';
import { ApiError } from '@/lib/api';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ChatWindow({ userId }: { userId: string }) {
  const { user: me } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useProfile(userId);
  const { data: threadData, isLoading: threadLoading } = useMessageThread(userId);
  const sendMessage = useSendMessage(userId);
  const markRead = useMarkThreadRead(userId);
  const { data: typingData } = useTypingIndicator(userId);
  const pingTyping = usePingTyping(userId);

  const [content, setContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingThrottle = useRef<number>(0);

  const messages = (threadData?.pages.flatMap((p) => p.items) ?? []).slice().reverse();
  const profile = profileData?.profile;
  const otherIsTyping = typingData?.isTyping ?? false;

  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, otherIsTyping]);

  const handleChange = (value: string) => {
    setContent(value);
    const now = Date.now();
    if (now - typingThrottle.current > 1500) {
      typingThrottle.current = now;
      pingTyping.mutate();
    }
  };

  const submit = async () => {
    if (!content.trim()) return;
    const text = content.trim();
    setContent('');
    try {
      await sendMessage.mutateAsync(text);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send message');
      setContent(text);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  if (profileLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return <div className="flex flex-1 items-center justify-center text-sm text-gray-400">User not found.</div>;
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <Link href={`/profile/${userId}`} className="flex items-center gap-3 border-b border-gray-100 p-3">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt={profile.firstName} className="h-10 w-10 rounded-full object-cover" />
        ) : null}
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {profile.firstName} {profile.lastName}
          </p>
          {otherIsTyping ? <p className="text-xs text-brand">typing…</p> : null}
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto p-4">
        {threadLoading ? <LoadingSpinner /> : null}
        {!threadLoading && messages.length === 0 ? (
          <p className="text-center text-xs text-gray-400">Say hello to start the conversation.</p>
        ) : null}
        <div className="space-y-2">
          {messages.map((m) => {
            const isMine = m.senderId === me?.id;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                    isMine ? 'bg-brand text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p>{m.content}</p>
                  <div className={`mt-1 flex items-center gap-1 text-[10px] ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                    <span>{timeAgo(m.createdAt)}</span>
                    {isMine ? (m.readAt ? <CheckCheck size={12} /> : <Check size={12} />) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {otherIsTyping ? (
          <div className="mt-2 flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-400">…</div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-gray-100 p-3">
        <textarea
          className="flex-1 resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
          placeholder="Write a message…"
          rows={1}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!content.trim() || sendMessage.isPending}
          className="rounded-md bg-brand p-2 text-white disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
