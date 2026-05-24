import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { DeviceState } from '../constants/ble';
import { appStyles } from '../styles/appStyles';

type ControlScreenProps = {
    connectionLabel: string;
    controlPassword: string;
    deviceState: DeviceState;
    isBusy: boolean;
    isConnected: boolean;
    onArm: () => void;
    onDisconnect: () => void;
    onReset: () => void;
    onChangeControlPassword: (value: string) => void;
};

export function ControlScreen({
    connectionLabel,
    controlPassword,
    deviceState,
    isBusy,
    isConnected,
    onArm,
    onDisconnect,
    onReset,
    onChangeControlPassword,
}: ControlScreenProps) {
    return (
        <View style={appStyles.sectionStack}>
            <View style={[appStyles.card, appStyles.heroCard]}>
                <Text style={appStyles.cardTitle}>Controle do alarme</Text>
                <Text style={appStyles.heroState}>{deviceState}</Text>
                <Text style={appStyles.cardCopy}>Use a mesma senha do dispositivo para ativar ou resetar o alarme remotamente.</Text>
                <TextInput
                    value={controlPassword}
                    onChangeText={onChangeControlPassword}
                    placeholder="Senha do dispositivo"
                    placeholderTextColor="#8c97aa"
                    secureTextEntry
                    style={appStyles.input}
                />
                <TouchableOpacity disabled={isBusy} style={appStyles.alertButton} onPress={onArm}>
                    <Text style={appStyles.alertButtonText}>Ativar alarme</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={isBusy} style={appStyles.secondaryButton} onPress={onReset}>
                    <Text style={appStyles.secondaryButtonText}>Desativar / resetar</Text>
                </TouchableOpacity>
            </View>

            <View style={appStyles.card}>
                <Text style={appStyles.cardTitle}>Conexao</Text>
                <Text style={appStyles.cardCopy}>{connectionLabel}</Text>
                <TouchableOpacity disabled={!isConnected || isBusy} style={appStyles.ghostButton} onPress={onDisconnect}>
                    <Text style={appStyles.ghostButtonText}>Desconectar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}