'use client';

import toast from 'react-hot-toast';
import { useTheme } from '@/hooks/useTheme';
import { useUpdateAppearance } from '@/hooks/useSettings';
import { ApiError } from '@/lib/api';

export default function AppearanceTab() {
  const { dark, compact, setDark, setCompact } = useTheme();
  const update = useUpdateAppearance();

  const handleThemeChange = async (nextDark: boolean) => {
    setDark(nextDark);
    try {
      await update.mutateAsync({ themePreference: nextDark ? 'DARK' : 'LIGHT' });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save appearance preference');
    }
  };

  const handleDensityChange = async (nextCompact: boolean) => {
    setCompact(nextCompact);
    try {
      await update.mutateAsync({ feedDensity: nextCompact ? 'COMPACT' : 'COMFORTABLE' });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save appearance preference');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700">Theme</h3>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => handleThemeChange(false)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${!dark ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange(true)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${dark ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Dark
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700">Feed density</h3>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => handleDensityChange(false)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${!compact ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Comfortable
          </button>
          <button
            type="button"
            onClick={() => handleDensityChange(true)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${compact ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Compact
          </button>
        </div>
      </div>
    </div>
  );
}
