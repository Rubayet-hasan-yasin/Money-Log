import React from 'react';
import {
  alert,
  toast,
  showExpoAlert,
  Toaster,
  AlertToaster,
  useAlert,
  AlertButton,
} from '@/components/ui/expo-alert';

export type { AlertButton };
export { alert, toast, showExpoAlert, Toaster, AlertToaster, useAlert };

/**
 * Backward-compatibility provider.
 * You no longer need to wrap your app in this Provider!
 * You can simply place `<Toaster />` in your root layout and call `alert(...)` anywhere.
 */
export function AlertProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
