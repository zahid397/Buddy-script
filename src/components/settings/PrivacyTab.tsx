'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { ContactPermission, PostVisibility, SettingsDTO } from '@/types';
import { useUpdatePrivacy } from '@/hooks/useSettings';
import { ApiError } from '@/lib/api';

const VISIBILITY_OPTIONS: { value: PostVisibility; label: string }[] = [
  { value: 'PUBLIC', label: 'Everyone' },
  { value: 'FRIENDS', label: 'Friends only' },
  { value: 'PRIVATE', label: 'Only me' },
];

const CONTACT_OPTIONS: { value: ContactPermission; label: string }[] = [
  { value: 'EVERYONE', label: 'Everyone' },
  { value: 'FRIENDS', label: 'Friends only' },
  { value: 'NOBODY', label: 'No one' },
];

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function PrivacyTab({ privacy }: { privacy: SettingsDTO['privacy'] }) {
  const [local, setLocal] = useState(privacy);
  const update = useUpdatePrivacy();

  const handleSave = async () => {
    try {
      await update.mutateAsync(local);
      toast.success('Privacy settings saved');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save privacy settings');
    }
  };

  return (
    <div className="space-y-4">
      <Select
        label="Who can see your profile"
        value={local.profileVisibility}
        options={VISIBILITY_OPTIONS}
        onChange={(v) => setLocal((s) => ({ ...s, profileVisibility: v as PostVisibility }))}
      />
      <Select
        label="Default visibility for new posts"
        value={local.defaultPostVisibility}
        options={VISIBILITY_OPTIONS}
        onChange={(v) => setLocal((s) => ({ ...s, defaultPostVisibility: v as PostVisibility }))}
      />
      <Select
        label="Who can send you friend requests"
        value={local.whoCanSendFriendRequest}
        options={CONTACT_OPTIONS}
        onChange={(v) => setLocal((s) => ({ ...s, whoCanSendFriendRequest: v as ContactPermission }))}
      />
      <Select
        label="Who can message you"
        value={local.whoCanMessage}
        options={CONTACT_OPTIONS}
        onChange={(v) => setLocal((s) => ({ ...s, whoCanMessage: v as ContactPermission }))}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={update.isPending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {update.isPending ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
