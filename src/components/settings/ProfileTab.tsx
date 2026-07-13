'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { SettingsDTO } from '@/types';
import { useUpdateProfile } from '@/hooks/useProfile';
import { apiFetch, ApiError } from '@/lib/api';

export default function ProfileTab({ profile }: { profile: SettingsDTO['profile'] }) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [location, setLocation] = useState(profile.location ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [coverImageUrl, setCoverImageUrl] = useState(profile.coverImageUrl);
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);
  const update = useUpdateProfile();

  const handleUpload = async (file: File, target: 'avatar' | 'cover') => {
    setUploading(target);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch<{ url: string }>('/api/upload', { method: 'POST', body: formData });
      if (target === 'avatar') setAvatarUrl(res.url);
      else setCoverImageUrl(res.url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    try {
      await update.mutateAsync({ firstName, lastName, bio, location, avatarUrl, coverImageUrl });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update profile');
    }
  };

  const busy = update.isPending || uploading !== null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="settings-cover" className="text-xs font-medium text-gray-500">
            Cover photo
          </label>
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt="Cover" className="mt-1 h-20 w-full rounded-md object-cover" />
          ) : null}
          <input
            id="settings-cover"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'cover')}
            className="mt-1 block w-full text-xs"
            disabled={busy}
          />
        </div>
        <div>
          <label htmlFor="settings-avatar" className="text-xs font-medium text-gray-500">
            Profile photo
          </label>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="mt-1 h-20 w-20 rounded-full object-cover" />
          ) : null}
          <input
            id="settings-avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'avatar')}
            className="mt-1 block w-full text-xs"
            disabled={busy}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="settings-first-name" className="text-xs font-medium text-gray-500">
            First name
          </label>
          <input
            id="settings-first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="settings-last-name" className="text-xs font-medium text-gray-500">
            Last name
          </label>
          <input
            id="settings-last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      <div>
        <label htmlFor="settings-location" className="text-xs font-medium text-gray-500">
          Location
        </label>
        <input
          id="settings-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, Country"
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      <div>
        <label htmlFor="settings-bio" className="text-xs font-medium text-gray-500">
          Bio
        </label>
        <textarea
          id="settings-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={280}
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={busy}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {update.isPending ? 'Saving…' : uploading ? 'Uploading…' : 'Save changes'}
      </button>
    </div>
  );
}
