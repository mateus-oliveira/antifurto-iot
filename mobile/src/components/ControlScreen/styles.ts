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
    justifyContent: 'center',
    minHeight: 150,
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
});