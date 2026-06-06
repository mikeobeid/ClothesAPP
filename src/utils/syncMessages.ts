import { Alert } from 'react-native';
import { SyncResult } from '../services/wardrobeSync';

export function getCloudSyncWarning(result: SyncResult): string | undefined {
  if (result.success) {
    if (result.error) {
      return result.error;
    }
    return undefined;
  }

  const message = result.error?.trim();
  if (!message) {
    return 'Cloud backup could not be updated. Your changes are saved on this device.';
  }

  if (message.includes('not configured') || message.includes('unavailable')) {
    return 'Cloud backup is unavailable right now. Your changes are saved on this device.';
  }

  return `Cloud backup could not be updated: ${message}. Your changes are saved on this device.`;
}

export function showCloudSyncWarning(
  title: string,
  warning: string | undefined,
  onDismiss?: () => void,
): void {
  if (!warning) {
    onDismiss?.();
    return;
  }

  Alert.alert(title, warning, [{ text: 'OK', onPress: onDismiss }]);
}
