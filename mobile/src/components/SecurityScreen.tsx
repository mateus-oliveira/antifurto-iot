import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { appStyles } from '../styles/appStyles';

type SecurityScreenProps = {
    currentPassword: string;
    nextPassword: string;
    confirmPassword: string;
    isBusy: boolean;
    onChangeCurrentPassword: (value: string) => void;
    onChangeNextPassword: (value: string) => void;
    onChangeConfirmPassword: (value: string) => void;
    onSavePassword: () => void;
};

export function SecurityScreen({
    currentPassword,
    nextPassword,
    confirmPassword,
    isBusy,
    onChangeCurrentPassword,
    onChangeNextPassword,
    onChangeConfirmPassword,
    onSavePassword,
}: SecurityScreenProps) {
    return (
        <View style={appStyles.sectionStack}>
            <View style={appStyles.card}>
                <Text style={appStyles.cardTitle}>Trocar senha</Text>
                <Text style={appStyles.cardCopy}>A nova senha sera persistida no ESP32 mesmo apos reinicio.</Text>
                <TextInput
                    value={currentPassword}
                    onChangeText={onChangeCurrentPassword}
                    placeholder="Senha atual"
                    placeholderTextColor="#8c97aa"
                    secureTextEntry
                    style={appStyles.input}
                />
                <TextInput
                    value={nextPassword}
                    onChangeText={onChangeNextPassword}
                    placeholder="Nova senha"
                    placeholderTextColor="#8c97aa"
                    secureTextEntry
                    style={appStyles.input}
                />
                <TextInput
                    value={confirmPassword}
                    onChangeText={onChangeConfirmPassword}
                    placeholder="Confirmar nova senha"
                    placeholderTextColor="#8c97aa"
                    secureTextEntry
                    style={appStyles.input}
                />
                <TouchableOpacity disabled={isBusy} style={appStyles.primaryButton} onPress={onSavePassword}>
                    <Text style={appStyles.primaryButtonText}>Salvar nova senha</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}