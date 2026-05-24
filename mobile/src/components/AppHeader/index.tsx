import { Text, View } from 'react-native';

import { APP_HEADER_EYEBROW, APP_HEADER_TITLE } from './constants';
import { styles } from './styles';
import type { AppHeaderProps } from './types';

export function AppHeader(_: AppHeaderProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.eyebrow}>{APP_HEADER_EYEBROW}</Text>
            <Text style={styles.title}>{APP_HEADER_TITLE}</Text>
        </View>
    );
}