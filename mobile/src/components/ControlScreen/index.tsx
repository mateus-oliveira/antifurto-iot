import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import {
  ARM_BUTTON_LABEL,
  CONNECTION_TITLE,
  CONTROL_PASSWORD_PLACEHOLDER,
  CONTROL_SCREEN_COPY,
  CONTROL_SCREEN_TITLE,
  DISCONNECT_BUTTON_LABEL,
  INPUT_PLACEHOLDER_TEXT_COLOR,
  RESET_BUTTON_LABEL,
} from './constants';
import { styles } from './styles';
import type { ControlScreenProps } from './types';

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
    <View style={styles.container}>
      <View style={[styles.card, styles.heroCard]}>
        <Text style={styles.cardTitle}>{CONTROL_SCREEN_TITLE}</Text>
        <Text style={styles.heroState}>{deviceState}</Text>
        <Text style={styles.cardCopy}>{CONTROL_SCREEN_COPY}</Text>
        <TextInput
          value={controlPassword}
          onChangeText={onChangeControlPassword}
          placeholder={CONTROL_PASSWORD_PLACEHOLDER}
          placeholderTextColor={INPUT_PLACEHOLDER_TEXT_COLOR}
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity disabled={isBusy} style={styles.alertButton} onPress={onArm}>
          <Text style={styles.alertButtonText}>{ARM_BUTTON_LABEL}</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={isBusy} style={styles.secondaryButton} onPress={onReset}>
          <Text style={styles.secondaryButtonText}>{RESET_BUTTON_LABEL}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{CONNECTION_TITLE}</Text>
        <Text style={styles.cardCopy}>{connectionLabel}</Text>
        <TouchableOpacity disabled={!isConnected || isBusy} style={styles.ghostButton} onPress={onDisconnect}>
          <Text style={styles.ghostButtonText}>{DISCONNECT_BUTTON_LABEL}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}