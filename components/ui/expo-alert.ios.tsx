import React from 'react';
import { View } from 'react-native';
import { Host, Alert, Button, Text } from '@expo/ui/swift-ui';
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
  return (
    <Host style={{ position: 'absolute', width: 0, height: 0 }}>
      <Alert
        title={title}
        isPresented={visible}
        onIsPresentedChange={(presented) => {
          if (!presented) {
            onDismiss();
          }
        }}
      >
        <Alert.Trigger>
          <View style={{ width: 0, height: 0 }} />
        </Alert.Trigger>
        <Alert.Actions>
          {buttons && buttons.length > 0 ? (
            buttons.map((btn, idx) => (
              <Button
                key={idx}
                label={btn.text}
                role={
                  btn.style === 'destructive'
                    ? 'destructive'
                    : btn.style === 'cancel'
                    ? 'cancel'
                    : undefined
                }
                onPress={() => {
                  onDismiss();
                  btn.onPress?.();
                }}
              />
            ))
          ) : (
            <Button label="OK" onPress={onDismiss} />
          )}
        </Alert.Actions>
        {message ? (
          <Alert.Message>
            <Text>{message}</Text>
          </Alert.Message>
        ) : null}
      </Alert>
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
