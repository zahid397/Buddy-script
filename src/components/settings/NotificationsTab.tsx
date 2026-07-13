'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { SettingsDTO } from '@/types';
import { useUpdateNotificationPrefs } from '@/hooks/useSettings';
import { ApiError } from '@/lib/api';

const FIELDS: { key: keyof SettingsDTO['notifications']; label: string }[] = [
  { key: 'notifyOnMessage', label: 'New messages' },
  { key: 'notifyOnFriendRequest', label: 'Friend requests' },
  { key: 'notifyOnComment', label: 'Comments on your posts' },
  { key: 'notifyOnGroupActivity', label: 'Group activity' },
  { key: 'notifyOnEvent', label: 'Event activity' },
];

export default function NotificationsTab({ notifications }: { notifications: SettingsDTO['notifications'] }) {
  const [local, setLocal] = useState(notifications);
  const update = useUpdateNotificationPrefs();

  const toggle = async (key: keyof SettingsDTO['notifications']) => {
    const next = { ...local, [key]: !local[key] };
    setLocal(next);
    try {
      await update.mutateAsync({ [key]: next[key] });
    } catch (err) {
      setLocal(local);
      toast.error(err instanceof ApiError ? err.message : 'Failed to update notification preference');
    }
  };

  return (
    <div className="space-y-1">
      {FIELDS.map(({ key, label }) => (
        <label
          key={key}
          className="flex cursor-pointer items-center justify-between border-b border-gray-50 py-3 last:border-0"
        >
          <span className="text-sm text-gray-700">{label}</span>
          <input
            type="checkbox"
            checked={local[key]}
            onChange={() => toggle(key)}
            className="h-4 w-4 accent-brand"
          />
        </label>
      ))}
    </div>
  );
}
