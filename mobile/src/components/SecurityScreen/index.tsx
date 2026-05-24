import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import {
  CONFIRM_PASSWORD_PLACEHOLDER,
  CURRENT_PASSWORD_PLACEHOLDER,
  INPUT_PLACEHOLDER_TEXT_COLOR,
  NEXT_PASSWORD_PLACEHOLDER,
  SAVE_PASSWORD_BUTTON_LABEL,
  SECURITY_SCREEN_COPY,
  SECURITY_SCREEN_TITLE,
} from './constants';
import { styles } from './styles';
import type { SecurityScreenProps } from './types';

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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{SECURITY_SCREEN_TITLE}</Text>
        <Text style={styles.cardCopy}>{SECURITY_SCREEN_COPY}</Text>
        <TextInput
          value={currentPassword}
          onChangeText={onChangeCurrentPassword}
          placeholder={CURRENT_PASSWORD_PLACEHOLDER}
          placeholderTextColor={INPUT_PLACEHOLDER_TEXT_COLOR}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          value={nextPassword}
          onChangeText={onChangeNextPassword}
          placeholder={NEXT_PASSWORD_PLACEHOLDER}
          placeholderTextColor={INPUT_PLACEHOLDER_TEXT_COLOR}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          value={confirmPassword}
          onChangeText={onChangeConfirmPassword}
          placeholder={CONFIRM_PASSWORD_PLACEHOLDER}
          placeholderTextColor={INPUT_PLACEHOLDER_TEXT_COLOR}
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity disabled={isBusy} style={styles.primaryButton} onPress={onSavePassword}>
          <Text style={styles.primaryButtonText}>{SAVE_PASSWORD_BUTTON_LABEL}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}