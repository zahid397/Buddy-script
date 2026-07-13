'use client';

import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProfileTab from '@/components/settings/ProfileTab';
import AccountTab from '@/components/settings/AccountTab';
import PrivacyTab from '@/components/settings/PrivacyTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import AppearanceTab from '@/components/settings/AppearanceTab';
import SecurityTab from '@/components/settings/SecurityTab';

const TABS = ['Profile', 'Account', 'Privacy', 'Notifications', 'Appearance', 'Security'] as const;
type Tab = (typeof TABS)[number];

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const [tab, setTab] = useState<Tab>('Profile');

  return (
    <div>
      <div className="_feed_inner_area _b_radious6 mb-4 bg-white px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">Settings</h2>
        <div className="mt-3 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === t ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="_feed_inner_area _b_radious6 bg-white p-5">
        {isLoading || !settings ? (
          <LoadingSpinner />
        ) : (
          <>
            {tab === 'Profile' ? <ProfileTab profile={settings.profile} /> : null}
            {tab === 'Account' ? <AccountTab account={settings.account} /> : null}
            {tab === 'Privacy' ? <PrivacyTab privacy={settings.privacy} /> : null}
            {tab === 'Notifications' ? <NotificationsTab notifications={settings.notifications} /> : null}
            {tab === 'Appearance' ? <AppearanceTab /> : null}
            {tab === 'Security' ? <SecurityTab account={settings.account} /> : null}
          </>
        )}
      </div>
    </div>
  );
}
