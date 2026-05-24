import { BleError, BleManager, Device, Subscription } from 'react-native-ble-plx';
import { decode as decodeBase64, encode as encodeBase64 } from 'base-64';

import {
    BLE_COMMAND_CHAR_UUID,
    BLE_DEVICE_NAME,
    BLE_SERVICE_UUID,
    BLE_STATUS_CHAR_UUID,
    StatusPacket,
    buildStatusCommand,
    parseStatusPacket,
} from '../constants/ble';

type DeviceListener = (devices: Device[]) => void;
type StatusListener = (packet: StatusPacket) => void;

class GuardmovelBleService {
    private manager: BleManager | null = new BleManager();
    private monitorSubscription: Subscription | null = null;
    private connectedDevice: Device | null = null;

    private ensureManager() {
        if (this.manager === null)
            this.manager = new BleManager();

        return this.manager;
    }

    async requestStatus() {
        return this.sendCommand(buildStatusCommand());
    }

    scanForDevices(onDevicesUpdated: DeviceListener, onError: (message: string) => void) {
        const seenDevices = new Map<string, Device>();
        const manager = this.ensureManager();

        manager.startDeviceScan(null, { allowDuplicates: false }, (error: BleError | null, device: Device | null) => {
            if (error) {
                onError(error.message);
                return;
            }

            if (!device) {
                return;
            }

            const deviceName = device.name ?? device.localName ?? '';
            const matchesGuardmovel = deviceName.includes('Guardmovel') || deviceName.includes(BLE_DEVICE_NAME);
            if (!matchesGuardmovel) {
                return;
            }

            seenDevices.set(device.id, device);
            onDevicesUpdated(Array.from(seenDevices.values()).sort((left, right) => (right.rssi ?? -120) - (left.rssi ?? -120)));
        });
    }

    stopScan() {
        this.manager?.stopDeviceScan();
    }

    async connect(device: Device, onStatus: StatusListener) {
        this.ensureManager();
        this.stopScan();
        this.monitorSubscription?.remove();

        const connected = await device.connect({ timeout: 15000 });
        const ready = await connected.discoverAllServicesAndCharacteristics();
        this.connectedDevice = ready;

        this.monitorSubscription = ready.monitorCharacteristicForService(
            BLE_SERVICE_UUID,
            BLE_STATUS_CHAR_UUID,
            (error, characteristic) => {
                if (error) {
                    onStatus({
                        type: 'ERROR',
                        state: 'UNKNOWN',
                        message: error.message,
                        raw: error.message,
                    });
                    return;
                }

                if (!characteristic?.value) {
                    return;
                }

                const decoded = decodeBase64(characteristic.value);
                onStatus(parseStatusPacket(decoded));
            },
        );

        await this.requestStatus();
        return ready;
    }

    async disconnect() {
        this.monitorSubscription?.remove();
        this.monitorSubscription = null;

        if (this.connectedDevice) {
            const deviceId = this.connectedDevice.id;
            this.connectedDevice = null;
            await this.ensureManager().cancelDeviceConnection(deviceId);
        }
    }

    async sendCommand(command: string) {
        if (!this.connectedDevice) {
            throw new Error('Nenhum dispositivo conectado.');
        }

        await this.connectedDevice.writeCharacteristicWithResponseForService(
            BLE_SERVICE_UUID,
            BLE_COMMAND_CHAR_UUID,
            encodeBase64(command),
        );
    }

    getConnectedDevice() {
        return this.connectedDevice;
    }

    destroy() {
        this.monitorSubscription?.remove();
        this.manager?.destroy();
        this.manager = null;
    }
}

export const bleService = new GuardmovelBleService();
