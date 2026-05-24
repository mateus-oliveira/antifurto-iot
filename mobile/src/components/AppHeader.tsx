import { Text, View } from 'react-native';

import { appStyles } from '../styles/appStyles';

export function AppHeader() {
    return (
        <View style={appStyles.header}>
            <Text style={appStyles.eyebrow}>GUARDMOVEL</Text>
            <Text style={appStyles.title}>Controle do alarme via Bluetooth</Text>
        </View>
    );
}