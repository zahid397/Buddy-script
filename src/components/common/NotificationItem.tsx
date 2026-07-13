'use client';

import Link from 'next/link';
import { AtSign, Bell, Calendar, GraduationCap, Heart, MessageCircle, MessageSquare, Share2, Trophy, UserPlus, Users, Users2 } from 'lucide-react';
import type { NotificationDTO } from '@/types';
import { timeAgo } from '@/lib/time';
import { useMarkNotificationRead } from '@/hooks/useNotifications';

const ICONS: Record<NotificationDTO['type'], typeof Bell> = {
  FRIEND_REQUEST: UserPlus,
  FRIEND_ACCEPTED: Users,
  FOLLOW: Users,
  LIKE: Heart,
  COMMENT: MessageSquare,
  REPLY: MessageSquare,
  MESSAGE: MessageCircle,
  EVENT: Calendar,
  SHARE: Share2,
  MENTION: AtSign,
  GROUP_POST: Users2,
  GROUP_JOIN: Users2,
  LESSON_RECOMMENDED: GraduationCap,
  LEADERBOARD: Trophy,
};

function messageFor(n: NotificationDTO): string {
  const name = n.actor ? `${n.actor.firstName} ${n.actor.lastName}` : 'Someone';
  switch (n.type) {
    case 'FRIEND_REQUEST':
      return `${name} sent you a friend request`;
    case 'FRIEND_ACCEPTED':
      return `${name} accepted your friend request`;
    case 'FOLLOW':
      return `${name} started following you`;
    case 'LIKE':
      return n.commentId ? `${name} liked your comment` : `${name} liked your post`;
    case 'COMMENT':
      return `${name} commented on your post`;
    case 'REPLY':
      return `${name} replied to your comment`;
    case 'MESSAGE':
      return `${name} sent you a message`;
    case 'EVENT':
      return `${name} is going to your event`;
    case 'SHARE':
      return `${name} shared your post`;
    case 'MENTION':
      return `${name} mentioned you in a post`;
    case 'GROUP_POST':
      return `${name} posted in a group you're in`;
    case 'GROUP_JOIN':
      return `${name} joined a group you're in`;
    case 'LESSON_RECOMMENDED':
      return 'A new lesson was recommended for you';
    case 'LEADERBOARD':
      return 'Your position on a game leaderboard changed';
    default:
      return 'New notification';
  }
}

function hrefFor(n: NotificationDTO): string {
  if (n.type === 'MESSAGE' && n.actor) return `/messages/${n.actor.id}`;
  if (n.type === 'EVENT') return '/feed';
  if (n.type === 'GROUP_POST' || n.type === 'GROUP_JOIN') return n.groupId ? `/groups/${n.groupId}` : '/groups';
  if (n.type === 'LESSON_RECOMMENDED') return '/learning';
  if (n.type === 'LEADERBOARD') return '/gaming';
  if (n.actor) return `/profile/${n.actor.id}`;
  return '/notifications';
}

export default function NotificationItem({ notification, onNavigate }: { notification: NotificationDTO; onNavigate?: () => void }) {
  const markRead = useMarkNotificationRead();
  const Icon = ICONS[notification.type] ?? Bell;

  const handleClick = () => {
    if (!notification.isRead) markRead.mutate(notification.id);
    onNavigate?.();
  };

  return (
    <Link
      href={hrefFor(notification)}
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 text-sm hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-gray-700">{messageFor(notification)}</span>
        <span className="mt-0.5 block text-xs text-gray-400">{timeAgo(notification.createdAt)}</span>
      </span>
      {!notification.isRead ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" /> : null}
    </Link>
  );
}
