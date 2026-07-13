'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { useUpdateProfile } from '@/hooks/useProfile';
import { apiFetch, ApiError } from '@/lib/api';
import type { ProfileDTO } from '@/types';

export default function EditProfileModal({ profile, onClose }: { profile: ProfileDTO; onClose: () => void }) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [bio, setBio] = useState(profile.bio ?? '');
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
      await update.mutateAsync({ firstName, lastName, bio, avatarUrl, coverImageUrl });
      toast.success('Profile updated');
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update profile');
    }
  };

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500">Cover photo</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'cover')}
            className="mt-1 block text-xs"
            disabled={uploading !== null}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Profile photo</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'avatar')}
            className="mt-1 block text-xs"
            disabled={uploading !== null}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-500">First name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Last name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Bio</label>
          <textarea
            value={bio ?? ''}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={280}
            className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={update.isPending || uploading !== null}
          className="w-full rounded-md bg-brand py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {update.isPending ? 'Saving…' : uploading ? 'Uploading…' : 'Save changes'}
        </button>
      </div>
    </Modal>
  );
}
