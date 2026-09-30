import { useSyncExternalStore } from 'react';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface ExpoAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss: () => void;
}

export interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

export interface ConfirmAsyncOptions {
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

let memoryState: AlertState = {
  visible: false,
  title: '',
  message: '',
  buttons: undefined,
  onDismiss: undefined,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  onDismissCallback?: () => void
) {
  memoryState = {
    visible: true,
    title,
    message,
    buttons,
    onDismiss: onDismissCallback,
  };
  notify();
}

function dismissAlert() {
  const prevDismiss = memoryState.onDismiss;
  memoryState = {
    ...memoryState,
    visible: false,
    onDismiss: undefined,
  };
  notify();
  prevDismiss?.();
}

/**
 * Imperative alert caller like react-hot-toast (e.g. `alert('Title', 'Message')`)
 */
export const alert = Object.assign(showAlert, {
  show: showAlert,
  dismiss: dismissAlert,
  hide: dismissAlert,
  alert: showAlert,
  error: (title: string, message?: string) => showAlert(title, message),
  success: (title: string, message?: string) => showAlert(title, message),

  /**
   * Callback-based confirmation
   */
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirm',
    isDestructive: boolean = false
  ) => {
    showAlert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: confirmText,
        style: isDestructive ? 'destructive' : 'default',
        onPress: onConfirm,
      },
    ]);
  },

  /**
   * Promise-based confirmation (awaitable in async functions!)
   *
   * @example
   * ```ts
   * const confirmed = await alert.confirmAsync('Approve Increment', 'Are you sure you want to approve this?');
   * if (confirmed) {
   *   // Proceed with increment
   * }
   * ```
   */
  confirmAsync: (
    title: string,
    message?: string,
    options?: ConfirmAsyncOptions
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      let settled = false;
      const confirmText = options?.confirmText ?? 'Confirm';
      const cancelText = options?.cancelText ?? 'Cancel';
      const isDestructive = options?.isDestructive ?? false;

      showAlert(
        title,
        message,
        [
          {
            text: cancelText,
            style: 'cancel',
            onPress: () => {
              if (!settled) {
                settled = true;
                resolve(false);
              }
            },
          },
          {
            text: confirmText,
            style: isDestructive ? 'destructive' : 'default',
            onPress: () => {
              if (!settled) {
                settled = true;
                resolve(true);
              }
            },
          },
        ],
        () => {
          // If dismissed by tapping outside
          if (!settled) {
            settled = true;
            resolve(false);
          }
        }
      );
    });
  },
});

export const toast = alert;
export const showExpoAlert = showAlert;

export function useAlertState(): AlertState {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    () => memoryState,
    () => memoryState
  );
}
