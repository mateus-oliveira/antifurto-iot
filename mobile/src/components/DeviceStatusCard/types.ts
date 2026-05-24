import { DeviceState } from '../../constants/ble';

export interface DeviceStatusCardProps {
    deviceState: DeviceState;
    statusType: string;
    statusMessage: string;
    lastUpdateLabel: string;
}