import { Text, View } from 'react-native';

import { DeviceState } from '../constants/ble';
import { appStyles } from '../styles/appStyles';

type DeviceStatusCardProps = {
    deviceState: DeviceState;
    statusType: string;
    statusMessage: string;
    lastUpdateLabel: string;
};

export function DeviceStatusCard({
    deviceState,
    statusType,
    statusMessage,
    lastUpdateLabel,
}: DeviceStatusCardProps) {
    const statusTone =
        deviceState === 'IDLE'
            ? appStyles.stateIdle
            : deviceState === 'ON_GUARD'
                ? appStyles.stateGuard
                : deviceState === 'ALARM'
                    ? appStyles.stateAlarm
                    : appStyles.stateUnknown;

    return (
        <View style={appStyles.statusCard}>
            <View style={appStyles.statusHeader}>
                <Text style={appStyles.statusLabel}>Estado atual</Text>
                <View style={[appStyles.stateBadge, statusTone]}>
                    <Text style={appStyles.stateBadgeText}>{deviceState}</Text>
                </View>
            </View>
            <Text style={appStyles.statusType}>{statusType}</Text>
            <Text style={appStyles.statusMessage}>{statusMessage}</Text>
            <Text style={appStyles.metaText}>Ultima atualizacao: {lastUpdateLabel}</Text>
        </View>
    );
}