import React from 'react';
import { Host, AlertDialog, Text, TextButton } from '@expo/ui/jetpack-compose';
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
  if (!visible) return null;

  let confirmBtn: AlertButton | undefined;
  let dismissBtn: AlertButton | undefined;

  if (buttons && buttons.length > 1) {
    dismissBtn = buttons.find((b) => b.style === 'cancel') || buttons[0];
    confirmBtn = buttons.find((b) => b !== dismissBtn) || buttons[1];
  } else if (buttons && buttons.length === 1) {
    confirmBtn = buttons[0];
  } else {
    confirmBtn = { text: 'OK' };
  }

  return (
    <Host matchContents>
      <AlertDialog onDismissRequest={onDismiss}>
        <AlertDialog.Title>
          <Text>{title}</Text>
        </AlertDialog.Title>
        {message ? (
          <AlertDialog.Text>
            <Text>{message}</Text>
          </AlertDialog.Text>
        ) : null}
        {dismissBtn && (
          <AlertDialog.DismissButton>
            <TextButton
              onClick={() => {
                onDismiss();
                dismissBtn?.onPress?.();
              }}
            >
              <Text>{dismissBtn.text}</Text>
            </TextButton>
          </AlertDialog.DismissButton>
        )}
        {confirmBtn && (
          <AlertDialog.ConfirmButton>
            <TextButton
              onClick={() => {
                onDismiss();
                confirmBtn?.onPress?.();
              }}
            >
              <Text>{confirmBtn.text}</Text>
            </TextButton>
          </AlertDialog.ConfirmButton>
        )}
      </AlertDialog>
    </Host>
  );
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
