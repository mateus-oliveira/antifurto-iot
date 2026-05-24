import { Text, TouchableOpacity, View } from 'react-native';
import { Device } from 'react-native-ble-plx';

import { appStyles } from '../styles/appStyles';

type SearchScreenProps = {
    devices: Device[];
    isBusy: boolean;
    isScanning: boolean;
    savedDeviceId: string | null;
    savedDeviceName: string | null;
    onConnect: (device: Device) => void;
    onReconnectSavedDevice: () => void;
    onScan: () => void;
};

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
        <View style={appStyles.sectionStack}>
            <View style={appStyles.card}>
                <Text style={appStyles.cardTitle}>Buscar dispositivos</Text>
                <Text style={appStyles.cardCopy}>
                    O app encontra o ESP32 por Bluetooth Low Energy e conecta usando o servico do Guardmovel.
                </Text>
                {savedDeviceName ? <Text style={appStyles.metaText}>Ultimo dispositivo: {savedDeviceName}</Text> : null}
                <TouchableOpacity disabled={isBusy || isScanning} style={appStyles.primaryButton} onPress={onScan}>
                    <Text style={appStyles.primaryButtonText}>{isScanning ? 'Buscando...' : 'Buscar dispositivos'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    disabled={isBusy || isScanning || !savedDeviceId}
                    style={appStyles.secondaryButton}
                    onPress={onReconnectSavedDevice}
                >
                    <Text style={appStyles.secondaryButtonText}>Reconectar ao ultimo dispositivo</Text>
                </TouchableOpacity>
            </View>

            <View style={appStyles.card}>
                <Text style={appStyles.cardTitle}>Dispositivos disponiveis</Text>
                {devices.length === 0 ? <Text style={appStyles.cardCopy}>Nenhum Guardmovel encontrado ainda.</Text> : null}
                {devices.map((device) => {
                    const label = device.name ?? device.localName ?? 'Dispositivo sem nome';
                    return (
                        <TouchableOpacity
                            key={device.id}
                            disabled={isBusy}
                            style={[appStyles.deviceRow, device.id === savedDeviceId && appStyles.deviceRowSaved]}
                            onPress={() => onConnect(device)}
                        >
                            <View>
                                <Text style={appStyles.deviceName}>{label}</Text>
                                <Text style={appStyles.deviceMeta}>
                                    {device.id}
                                    {device.id === savedDeviceId ? '  •  salvo' : ''}
                                </Text>
                            </View>
                            <Text style={appStyles.deviceSignal}>{device.rssi ?? '--'} dBm</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}