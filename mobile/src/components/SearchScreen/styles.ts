import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
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
  metaText: {
    color: '#8fa2c0',
    fontSize: 12,
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