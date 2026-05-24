import { Text, View } from 'react-native';

import { LAST_UPDATE_PREFIX, STATUS_CARD_LABEL } from './constants';
import { styles } from './styles';
import type { DeviceStatusCardProps } from './types';

export function DeviceStatusCard({
    deviceState,
    statusType,
    statusMessage,
    lastUpdateLabel,
}: DeviceStatusCardProps) {
    const statusTone =
        deviceState === 'IDLE'
            ? styles.stateIdle
            : deviceState === 'ON_GUARD'
                ? styles.stateGuard
                : deviceState === 'ALARM'
                    ? styles.stateAlarm
                    : styles.stateUnknown;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.statusLabel}>{STATUS_CARD_LABEL}</Text>
                <View style={[styles.stateBadge, statusTone]}>
                    <Text style={styles.stateBadgeText}>{deviceState}</Text>
                </View>
            </View>
            <Text style={styles.statusType}>{statusType}</Text>
            <Text style={styles.statusMessage}>{statusMessage}</Text>
            <Text style={styles.metaText}>
                {LAST_UPDATE_PREFIX} {lastUpdateLabel}
            </Text>
        </View>
    );
}