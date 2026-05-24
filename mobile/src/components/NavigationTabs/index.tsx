import { Text, TouchableOpacity, View } from 'react-native';

import { NAVIGATION_TABS } from './constants';
import { styles } from './styles';
import type { NavigationTabsProps } from './types';

export function NavigationTabs({ activeScreen, onChangeScreen }: NavigationTabsProps) {
  return (
    <View style={styles.navBar}>
      {NAVIGATION_TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.navItem, activeScreen === tab.key && styles.navItemActive]}
          onPress={() => onChangeScreen(tab.key)}
        >
          <Text style={styles.navText}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}