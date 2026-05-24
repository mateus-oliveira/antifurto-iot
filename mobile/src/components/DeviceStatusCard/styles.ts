import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(13, 21, 34, 0.78)',
        borderColor: 'rgba(133, 164, 214, 0.18)',
        borderRadius: 22,
        borderWidth: 1,
        gap: 8,
        padding: 18,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusLabel: {
        color: '#9fb0ca',
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    stateBadge: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    stateIdle: {
        backgroundColor: '#355784',
    },
    stateGuard: {
        backgroundColor: '#7a651b',
    },
    stateAlarm: {
        backgroundColor: '#8e2e2c',
    },
    stateUnknown: {
        backgroundColor: '#485569',
    },
    stateBadgeText: {
        color: '#f6f9ff',
        fontSize: 12,
        fontWeight: '800',
    },
    statusType: {
        color: '#c2d8ff',
        fontSize: 16,
        fontWeight: '700',
    },
    statusMessage: {
        color: '#edf2fb',
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
    },
    metaText: {
        color: '#8fa2c0',
        fontSize: 12,
    },
});