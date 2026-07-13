'use client';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import type { SettingsDTO } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function SecurityTab({ account }: { account: SettingsDTO['account'] }) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Signed out');
      router.push('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 p-4">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand" />
        <div>
          <p className="text-sm font-medium text-gray-700">Current session</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Signed in as {account.email} · Account created {new Date(account.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        This app uses a single signed session cookie rather than a multi-device session store, so there isn&apos;t a
        list of other active sessions to show or revoke individually. Signing out below ends your session on this
        device.
      </p>

      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600"
      >
        Sign out on this device
      </button>
    </div>
  );
}
