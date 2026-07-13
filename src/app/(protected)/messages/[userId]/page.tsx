'use client';

import ConversationList from '@/components/messages/ConversationList';
import ChatWindow from '@/components/messages/ChatWindow';

export default function ConversationPage({ params }: { params: { userId: string } }) {
  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[420px] flex-col overflow-hidden rounded-card bg-white shadow-sm md:flex-row">
      <div className="hidden md:block">
        <ConversationList activeUserId={params.userId} />
      </div>
      <ChatWindow userId={params.userId} />
    </div>
  );
}
