import { Device } from 'react-native-ble-plx';

export interface SearchScreenProps {
  devices: Device[];
  isBusy: boolean;
  isScanning: boolean;
  savedDeviceId: string | null;
  savedDeviceName: string | null;
  onConnect: (device: Device) => void;
  onReconnectSavedDevice: () => void;
  onScan: () => void;
}