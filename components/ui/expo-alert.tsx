import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import {
  alert,
  toast,
  showExpoAlert,
  useAlertState,
  AlertButton,
  ExpoAlertProps,
  AlertState,
  ConfirmAsyncOptions,
} from './alert-store';

export type { AlertButton, ExpoAlertProps, AlertState, ConfirmAsyncOptions };
export { alert, toast, showExpoAlert, useAlertState };

export function ExpoAlert({ visible, title, message, buttons, onDismiss }: ExpoAlertProps) {
  useEffect(() => {
    if (visible) {
      if (buttons && buttons.length > 0) {
        const mappedButtons = buttons.map((btn) => ({
          text: btn.text,
          style: btn.style,
          onPress: () => {
            onDismiss();
            btn.onPress?.();
          },
        }));
        Alert.alert(title, message || '', mappedButtons);
      } else {
        Alert.alert(title, message || '', [{ text: 'OK', onPress: onDismiss }]);
      }
    }
  }, [visible, title, message, buttons, onDismiss]);

  return null;
}

/**
 * Standalone component like react-hot-toast `<Toaster />`.
 * Place this once at your root layout (e.g. `app/_layout.tsx`).
 */
export function Toaster() {
  const state = useAlertState();

  return (
    <ExpoAlert
      visible={state.visible}
      title={state.title}
      message={state.message}
      buttons={state.buttons}
      onDismiss={alert.dismiss}
    />
  );
}

export const AlertToaster = Toaster;

export function useAlert() {
  return {
    showAlert: alert.show,
    hideAlert: alert.dismiss,
    alert,
  };
}
