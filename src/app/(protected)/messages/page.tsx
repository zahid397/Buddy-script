'use client';

import { MessageCircle } from 'lucide-react';
import ConversationList from '@/components/messages/ConversationList';

export default function MessagesPage() {
  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[420px] flex-col overflow-hidden rounded-card bg-white shadow-sm md:flex-row">
      <ConversationList />
      <div className="hidden flex-1 items-center justify-center text-sm text-gray-400 md:flex">
        <div className="text-center">
          <MessageCircle size={32} className="mx-auto mb-2 text-gray-300" />
          Select a conversation to start chatting.
        </div>
      </div>
    </div>
  );
}
