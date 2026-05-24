import { Text, TouchableOpacity, View } from 'react-native';

import {
  AVAILABLE_DEVICES_TITLE,
  EMPTY_DEVICES_MESSAGE,
  RECONNECT_BUTTON_LABEL,
  SAVED_DEVICE_BADGE,
  SAVED_DEVICE_PREFIX,
  SEARCH_BUTTON_BUSY,
  SEARCH_BUTTON_IDLE,
  SEARCH_SCREEN_COPY,
  SEARCH_SCREEN_TITLE,
  UNNAMED_DEVICE_LABEL,
} from './constants';
import { styles } from './styles';
import type { SearchScreenProps } from './types';

export function SearchScreen({
  devices,
  isBusy,
  isScanning,
  savedDeviceId,
  savedDeviceName,
  onConnect,
  onReconnectSavedDevice,
  onScan,
}: SearchScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{SEARCH_SCREEN_TITLE}</Text>
        <Text style={styles.cardCopy}>{SEARCH_SCREEN_COPY}</Text>
        {savedDeviceName ? <Text style={styles.metaText}>{SAVED_DEVICE_PREFIX} {savedDeviceName}</Text> : null}
        <TouchableOpacity disabled={isBusy || isScanning} style={styles.primaryButton} onPress={onScan}>
          <Text style={styles.primaryButtonText}>{isScanning ? SEARCH_BUTTON_BUSY : SEARCH_BUTTON_IDLE}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={isBusy || isScanning || !savedDeviceId}
          style={styles.secondaryButton}
          onPress={onReconnectSavedDevice}
        >
          <Text style={styles.secondaryButtonText}>{RECONNECT_BUTTON_LABEL}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{AVAILABLE_DEVICES_TITLE}</Text>
        {devices.length === 0 ? <Text style={styles.cardCopy}>{EMPTY_DEVICES_MESSAGE}</Text> : null}
        {devices.map((device) => {
          const label = device.name ?? device.localName ?? UNNAMED_DEVICE_LABEL;
          return (
            <TouchableOpacity
              key={device.id}
              disabled={isBusy}
              style={[styles.deviceRow, device.id === savedDeviceId && styles.deviceRowSaved]}
              onPress={() => onConnect(device)}
            >
              <View>
                <Text style={styles.deviceName}>{label}</Text>
                <Text style={styles.deviceMeta}>
                  {device.id}
                  {device.id === savedDeviceId ? SAVED_DEVICE_BADGE : ''}
                </Text>
              </View>
              <Text style={styles.deviceSignal}>{device.rssi ?? '--'} dBm</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}