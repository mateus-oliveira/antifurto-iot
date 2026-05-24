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
});