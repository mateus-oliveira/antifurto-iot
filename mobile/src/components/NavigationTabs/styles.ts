import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
});