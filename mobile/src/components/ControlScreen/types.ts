import { DeviceState } from '../../constants/ble';

export interface ControlScreenProps {
  connectionLabel: string;
  controlPassword: string;
  deviceState: DeviceState;
  isBusy: boolean;
  isConnected: boolean;
  onArm: () => void;
  onDisconnect: () => void;
  onReset: () => void;
  onChangeControlPassword: (value: string) => void;
}