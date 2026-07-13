'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { SettingsDTO } from '@/types';
import type {
  ChangePasswordInput,
  UpdateAppearanceInput,
  UpdateNotificationPrefsInput,
  UpdatePrivacyInput,
} from '@/lib/validation';

export const SETTINGS_KEY = ['settings'];

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => apiFetch<SettingsDTO>('/api/settings'),
  });
}

export function useUpdatePrivacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePrivacyInput) =>
      apiFetch<SettingsDTO['privacy']>('/api/settings/privacy', { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: (privacy) => {
      queryClient.setQueryData<SettingsDTO>(SETTINGS_KEY, (old) => (old ? { ...old, privacy } : old));
    },
  });
}

export function useUpdateNotificationPrefs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNotificationPrefsInput) =>
      apiFetch<SettingsDTO['notifications']>('/api/settings/notifications', { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: (notifications) => {
      queryClient.setQueryData<SettingsDTO>(SETTINGS_KEY, (old) => (old ? { ...old, notifications } : old));
    },
  });
}

export function useUpdateAppearance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAppearanceInput) =>
      apiFetch<SettingsDTO['appearance']>('/api/settings/appearance', { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: (appearance) => {
      queryClient.setQueryData<SettingsDTO>(SETTINGS_KEY, (old) => (old ? { ...old, appearance } : old));
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      apiFetch<{ success: true }>('/api/settings/password', { method: 'POST', body: JSON.stringify(input) }),
  });
}
