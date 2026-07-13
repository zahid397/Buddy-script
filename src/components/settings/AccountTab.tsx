'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';
import type { SettingsDTO } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useChangePassword } from '@/hooks/useSettings';
import { changePasswordSchema } from '@/lib/validation';
import { ApiError } from '@/lib/api';

export default function AccountTab({ account }: { account: SettingsDTO['account'] }) {
  const { logout } = useAuth();
  const router = useRouter();
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? 'Invalid input');
      return;
    }
    try {
      await changePassword.mutateAsync(parsed.data);
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update password');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out');
      router.push('/login');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-medium text-gray-500">Email</label>
        <p className="mt-1 text-sm text-gray-800">{account.email}</p>
        <p className="mt-1 text-xs text-gray-400">
          Member since {new Date(account.createdAt).toLocaleDateString()}
        </p>
      </div>

      {account.source === 'USER' ? (
        <form onSubmit={handleChangePassword} className="space-y-3 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Change password</h3>
          <div>
            <label htmlFor="current-password" className="text-xs font-medium text-gray-500">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="text-xs font-medium text-gray-500">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={changePassword.isPending}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {changePassword.isPending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      ) : (
        <p className="border-t border-gray-100 pt-4 text-xs text-gray-400">
          You signed in with {account.source === 'GOOGLE' ? 'Google' : 'a demo account'} — password changes aren&apos;t
          applicable to this sign-in method.
        </p>
      )}

      <div className="border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );
}
