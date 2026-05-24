import { StyleSheet } from 'react-native';

export const appStyles = StyleSheet.create({
    background: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingBottom: 32,
        paddingTop: 12,
        gap: 16,
    },
    header: {
        gap: 8,
        paddingTop: 12,
    },
    eyebrow: {
        color: '#7ea4d6',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
    },
    title: {
        color: '#f4f7fb',
        fontSize: 28,
        fontWeight: '800',
    },
    subtitle: {
        color: '#b8c5d9',
        fontSize: 14,
        lineHeight: 20,
    },
    statusCard: {
        backgroundColor: 'rgba(13, 21, 34, 0.78)',
        borderColor: 'rgba(133, 164, 214, 0.18)',
        borderRadius: 22,
        borderWidth: 1,
        gap: 8,
        padding: 18,
    },
    statusHeader: {
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
    navBar: {
        backgroundColor: 'rgba(10, 17, 28, 0.74)',
        borderRadius: 18,
        flexDirection: 'row',
        padding: 6,
    },
    navItem: {
        alignItems: 'center',
        borderRadius: 14,
        flex: 1,
        paddingVertical: 12,
    },
    navItemActive: {
        backgroundColor: '#476992',
    },
    navText: {
        color: '#f4f7fb',
        fontSize: 14,
        fontWeight: '700',
    },
    sectionStack: {
        gap: 14,
    },
    card: {
        backgroundColor: 'rgba(10, 16, 28, 0.82)',
        borderColor: 'rgba(120, 149, 197, 0.18)',
        borderRadius: 22,
        borderWidth: 1,
        gap: 14,
        padding: 18,
    },
    heroCard: {
        backgroundColor: 'rgba(24, 22, 28, 0.84)',
    },
    cardTitle: {
        color: '#eef3fb',
        fontSize: 18,
        fontWeight: '800',
    },
    cardCopy: {
        color: '#b8c6dc',
        fontSize: 14,
        lineHeight: 20,
    },
    heroState: {
        color: '#ff8f84',
        fontSize: 34,
        fontWeight: '800',
    },
    input: {
        backgroundColor: '#0e1728',
        borderColor: '#334761',
        borderRadius: 14,
        borderWidth: 1,
        color: '#f7fbff',
        fontSize: 16,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    primaryButton: {
        alignItems: 'center',
        backgroundColor: '#476992',
        borderRadius: 14,
        paddingVertical: 15,
    },
    primaryButtonText: {
        color: '#f5f8fd',
        fontSize: 15,
        fontWeight: '800',
    },
    secondaryButton: {
        alignItems: 'center',
        backgroundColor: '#24364f',
        borderRadius: 14,
        paddingVertical: 15,
    },
    secondaryButtonText: {
        color: '#f1f5fc',
        fontSize: 15,
        fontWeight: '800',
    },
    alertButton: {
        alignItems: 'center',
        backgroundColor: '#dd4d3f',
        borderRadius: 18,
        minHeight: 150,
        justifyContent: 'center',
        paddingHorizontal: 18,
    },
    alertButtonText: {
        color: '#fff7f4',
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
    },
    ghostButton: {
        alignItems: 'center',
        borderColor: '#59779e',
        borderRadius: 14,
        borderWidth: 1,
        paddingVertical: 14,
    },
    ghostButtonText: {
        color: '#dbe7fb',
        fontSize: 14,
        fontWeight: '700',
    },
    deviceRow: {
        alignItems: 'center',
        backgroundColor: '#111c2d',
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    deviceRowSaved: {
        borderColor: '#5b80af',
        borderWidth: 1,
    },
    deviceName: {
        color: '#f3f8ff',
        fontSize: 15,
        fontWeight: '700',
    },
    deviceMeta: {
        color: '#88a0c4',
        fontSize: 12,
        marginTop: 4,
    },
    deviceSignal: {
        color: '#b9c9de',
        fontSize: 12,
        fontWeight: '700',
    },
});