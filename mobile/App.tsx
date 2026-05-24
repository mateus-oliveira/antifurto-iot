import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Device } from 'react-native-ble-plx';

import {
  DeviceState,
  StatusPacket,
  buildArmCommand,
  buildChangePasswordCommand,
  buildResetCommand,
} from './src/constants/ble';
import { bleService } from './src/services/bleService';

type Screen = 'buscar' | 'controle' | 'seguranca';

const LAST_DEVICE_ID_KEY = 'guardmovel:last-device-id';
const LAST_DEVICE_NAME_KEY = 'guardmovel:last-device-name';

export default function App() {
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeScreen, setActiveScreen] = useState<Screen>('buscar');
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [savedDeviceId, setSavedDeviceId] = useState<string | null>(null);
  const [savedDeviceName, setSavedDeviceName] = useState<string | null>(null);
  const [deviceState, setDeviceState] = useState<DeviceState>('UNKNOWN');
  const [statusType, setStatusType] = useState('READY');
  const [statusMessage, setStatusMessage] = useState('Aguardando conexao BLE');
  const [lastUpdateLabel, setLastUpdateLabel] = useState('--:--');
  const [controlPassword, setControlPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    void loadSavedDeviceInfo();

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      bleService.destroy();
    };
  }, []);

  const connectionLabel = connectedDevice ? `Conectado a ${connectedDevice.name ?? connectedDevice.localName ?? connectedDevice.id}` : 'Desconectado';
  const statusTone = useMemo(() => {
    switch (deviceState) {
      case 'IDLE':
        return styles.stateIdle;
      case 'ON_GUARD':
        return styles.stateGuard;
      case 'ALARM':
        return styles.stateAlarm;
      default:
        return styles.stateUnknown;
    }
  }, [deviceState]);

  async function loadSavedDeviceInfo() {
    const id = await AsyncStorage.getItem(LAST_DEVICE_ID_KEY);
    const name = await AsyncStorage.getItem(LAST_DEVICE_NAME_KEY);
    setSavedDeviceId(id);
    setSavedDeviceName(name);
  }

  function stopScanWithMessage(message?: string) {
    bleService.stopScan();
    setIsScanning(false);
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    if (message) {
      setStatusType('SCAN');
      setStatusMessage(message);
    }
  }

  function handleStatus(packet: StatusPacket) {
    setStatusType(packet.type);
    setStatusMessage(packet.message);
    setDeviceState(packet.state);
    setLastUpdateLabel(
      new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date()),
    );
  }

  async function requestBluetoothPermissions() {
    if (Platform.OS !== 'android') {
      return true;
    }

    const isAndroid12OrAbove = typeof Platform.Version === 'number' && Platform.Version >= 31;
    const permissions = isAndroid12OrAbove
      ? [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

    const result = await PermissionsAndroid.requestMultiple(permissions);
    return permissions.every((permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED);
  }

  async function handleScan() {
    const granted = await requestBluetoothPermissions();
    if (!granted) {
      Alert.alert('Permissoes necessarias', 'O app precisa de permissoes Bluetooth para encontrar o ESP32.');
      return;
    }

    setDevices([]);
    setIsScanning(true);
    setStatusType('SCAN');
    setStatusMessage('Buscando dispositivos Guardmovel proximos');

    bleService.scanForDevices(
      (scannedDevices) => {
        setDevices(scannedDevices);
      },
      (message) => {
        setIsScanning(false);
        setStatusType('ERROR');
        setStatusMessage(message);
      },
    );

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    scanTimeoutRef.current = setTimeout(() => {
      stopScanWithMessage('Busca finalizada. Escolha um dispositivo da lista.');
    }, 8000);
  }

  async function handleReconnectSavedDevice() {
    if (!savedDeviceId) {
      Alert.alert('Sem historico', 'Conecte ao menos uma vez para reutilizar o ultimo dispositivo.');
      return;
    }

    const granted = await requestBluetoothPermissions();
    if (!granted) {
      Alert.alert('Permissoes necessarias', 'O app precisa de permissoes Bluetooth para reencontrar o ESP32 salvo.');
      return;
    }

    setDevices([]);
    setIsScanning(true);
    setStatusType('SCAN');
    setStatusMessage('Procurando o ultimo Guardmovel conectado');

    bleService.scanForDevices(
      (scannedDevices) => {
        setDevices(scannedDevices);
        const rememberedDevice = scannedDevices.find((device) => device.id === savedDeviceId);
        if (!rememberedDevice || isBusy) {
          return;
        }

        stopScanWithMessage('Ultimo dispositivo encontrado. Conectando...');
        void handleConnect(rememberedDevice);
      },
      (message) => {
        setIsScanning(false);
        setStatusType('ERROR');
        setStatusMessage(message);
      },
    );

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    scanTimeoutRef.current = setTimeout(() => {
      stopScanWithMessage('Ultimo dispositivo nao foi encontrado nesta busca.');
    }, 8000);
  }

  async function handleConnect(device: Device) {
    try {
      setIsBusy(true);
      await bleService.connect(device, handleStatus);
      setConnectedDevice(device);
      setSavedDeviceId(device.id);
      setSavedDeviceName(device.name ?? device.localName ?? device.id);
      await AsyncStorage.multiSet([
        [LAST_DEVICE_ID_KEY, device.id],
        [LAST_DEVICE_NAME_KEY, device.name ?? device.localName ?? device.id],
      ]);
      setStatusType('CONNECTED');
      setStatusMessage('Conexao BLE estabelecida com sucesso');
      setActiveScreen('controle');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao conectar ao dispositivo.';
      setStatusType('ERROR');
      setStatusMessage(message);
      Alert.alert('Falha na conexao', message);
    } finally {
      setIsBusy(false);
      stopScanWithMessage();
    }
  }

  async function handleDisconnect() {
    try {
      setIsBusy(true);
      await bleService.disconnect();
      setConnectedDevice(null);
      setDeviceState('UNKNOWN');
      setStatusType('DISCONNECTED');
      setStatusMessage('Conexao encerrada.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao desconectar.';
      Alert.alert('Erro ao desconectar', message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleArm() {
    if (!connectedDevice) {
      Alert.alert('Sem conexao', 'Conecte-se ao ESP32 antes de armar o alarme.');
      return;
    }

    if (!controlPassword.trim()) {
      Alert.alert('Senha obrigatoria', 'Informe a senha para ativar o alarme.');
      return;
    }

    try {
      setIsBusy(true);
      await bleService.sendCommand(buildArmCommand(controlPassword));
      setStatusType('ARM');
      setStatusMessage('Comando de ativacao enviado. Aguarde a calibracao.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel ativar o alarme.';
      Alert.alert('Erro ao ativar', message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReset() {
    if (!connectedDevice) {
      Alert.alert('Sem conexao', 'Conecte-se ao ESP32 antes de resetar o alarme.');
      return;
    }

    if (!controlPassword.trim()) {
      Alert.alert('Senha obrigatoria', 'Informe a senha para resetar o alarme.');
      return;
    }

    try {
      setIsBusy(true);
      await bleService.sendCommand(buildResetCommand(controlPassword));
      setStatusType('RESET');
      setStatusMessage('Comando de reset enviado.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel resetar o alarme.';
      Alert.alert('Erro ao resetar', message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleChangePassword() {
    if (!connectedDevice) {
      Alert.alert('Sem conexao', 'Conecte-se ao ESP32 antes de trocar a senha.');
      return;
    }

    if (!currentPassword.trim() || !nextPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Campos obrigatorios', 'Preencha senha atual, nova senha e confirmacao.');
      return;
    }

    if (nextPassword.trim() !== confirmPassword.trim()) {
      Alert.alert('Confirmacao invalida', 'A confirmacao precisa ser igual a nova senha.');
      return;
    }

    try {
      setIsBusy(true);
      await bleService.sendCommand(buildChangePasswordCommand(currentPassword, nextPassword, confirmPassword));
      setStatusType('PASSWORD');
      setStatusMessage('Solicitacao de troca de senha enviada.');
      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel trocar a senha.';
      Alert.alert('Erro ao trocar senha', message);
    } finally {
      setIsBusy(false);
    }
  }

  function renderSearchScreen() {
    return (
      <View style={styles.sectionStack}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Buscar dispositivos</Text>
          <Text style={styles.cardCopy}>
            O app encontra o ESP32 por Bluetooth Low Energy e conecta usando o servico do Guardmovel.
          </Text>
          {savedDeviceName ? <Text style={styles.metaText}>Ultimo dispositivo: {savedDeviceName}</Text> : null}
          <TouchableOpacity disabled={isBusy || isScanning} style={styles.primaryButton} onPress={() => void handleScan()}>
            <Text style={styles.primaryButtonText}>{isScanning ? 'Buscando...' : 'Buscar dispositivos'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isBusy || isScanning || !savedDeviceId}
            style={styles.secondaryButton}
            onPress={() => void handleReconnectSavedDevice()}
          >
            <Text style={styles.secondaryButtonText}>Reconectar ao ultimo dispositivo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dispositivos disponiveis</Text>
          {devices.length === 0 ? <Text style={styles.cardCopy}>Nenhum Guardmovel encontrado ainda.</Text> : null}
          {devices.map((device) => {
            const label = device.name ?? device.localName ?? 'Dispositivo sem nome';
            return (
              <TouchableOpacity
                key={device.id}
                disabled={isBusy}
                style={[styles.deviceRow, device.id === savedDeviceId && styles.deviceRowSaved]}
                onPress={() => void handleConnect(device)}
              >
                <View>
                  <Text style={styles.deviceName}>{label}</Text>
                  <Text style={styles.deviceMeta}>
                    {device.id}
                    {device.id === savedDeviceId ? '  •  salvo' : ''}
                  </Text>
                </View>
                <Text style={styles.deviceSignal}>{device.rssi ?? '--'} dBm</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  function renderControlScreen() {
    return (
      <View style={styles.sectionStack}>
        <View style={[styles.card, styles.heroCard]}>
          <Text style={styles.cardTitle}>Controle do alarme</Text>
          <Text style={styles.heroState}>{deviceState}</Text>
          <Text style={styles.cardCopy}>Use a mesma senha do dispositivo para ativar ou resetar o alarme remotamente.</Text>
          <TextInput
            value={controlPassword}
            onChangeText={setControlPassword}
            placeholder="Senha do dispositivo"
            placeholderTextColor="#8c97aa"
            secureTextEntry
            style={styles.input}
          />
          <TouchableOpacity disabled={isBusy} style={styles.alertButton} onPress={() => void handleArm()}>
            <Text style={styles.alertButtonText}>Ativar alarme</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={isBusy} style={styles.secondaryButton} onPress={() => void handleReset()}>
            <Text style={styles.secondaryButtonText}>Desativar / resetar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conexao</Text>
          <Text style={styles.cardCopy}>{connectionLabel}</Text>
          <TouchableOpacity disabled={!connectedDevice || isBusy} style={styles.ghostButton} onPress={() => void handleDisconnect()}>
            <Text style={styles.ghostButtonText}>Desconectar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderSecurityScreen() {
    return (
      <View style={styles.sectionStack}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trocar senha</Text>
          <Text style={styles.cardCopy}>A nova senha sera persistida no ESP32 mesmo apos reinicio.</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Senha atual"
            placeholderTextColor="#8c97aa"
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            value={nextPassword}
            onChangeText={setNextPassword}
            placeholder="Nova senha"
            placeholderTextColor="#8c97aa"
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirmar nova senha"
            placeholderTextColor="#8c97aa"
            secureTextEntry
            style={styles.input}
          />
          <TouchableOpacity disabled={isBusy} style={styles.primaryButton} onPress={() => void handleChangePassword()}>
            <Text style={styles.primaryButtonText}>Salvar nova senha</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#08111f", "#12233a", "#223858"]} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>GUARDMOVEL</Text>
            <Text style={styles.title}>Controle do alarme via Bluetooth</Text>
            <Text style={styles.subtitle}>Expo Dev Client + ESP32 BLE. O app nao funciona no Expo Go.</Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusLabel}>Estado atual</Text>
              <View style={[styles.stateBadge, statusTone]}>
                <Text style={styles.stateBadgeText}>{deviceState}</Text>
              </View>
            </View>
            <Text style={styles.statusType}>{statusType}</Text>
            <Text style={styles.statusMessage}>{statusMessage}</Text>
            <Text style={styles.metaText}>Ultima atualizacao: {lastUpdateLabel}</Text>
          </View>

          <View style={styles.navBar}>
            <TouchableOpacity style={[styles.navItem, activeScreen === 'buscar' && styles.navItemActive]} onPress={() => setActiveScreen('buscar')}>
              <Text style={styles.navText}>Buscar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navItem, activeScreen === 'controle' && styles.navItemActive]} onPress={() => setActiveScreen('controle')}>
              <Text style={styles.navText}>Controle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navItem, activeScreen === 'seguranca' && styles.navItemActive]} onPress={() => setActiveScreen('seguranca')}>
              <Text style={styles.navText}>Seguranca</Text>
            </TouchableOpacity>
          </View>

          {activeScreen === 'buscar' ? renderSearchScreen() : null}
          {activeScreen === 'controle' ? renderControlScreen() : null}
          {activeScreen === 'seguranca' ? renderSecurityScreen() : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    paddingTop: 12,
    gap: 16,
  },
  header: {
    gap: 8,
    paddingTop: 12,
  },
  eyebrow: {
    color: '#7ea4d6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#f4f7fb',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#b8c5d9',
    fontSize: 14,
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(13, 21, 34, 0.78)',
    borderColor: 'rgba(133, 164, 214, 0.18)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  statusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLabel: {
    color: '#9fb0ca',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stateBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stateIdle: {
    backgroundColor: '#355784',
  },
  stateGuard: {
    backgroundColor: '#7a651b',
  },
  stateAlarm: {
    backgroundColor: '#8e2e2c',
  },
  stateUnknown: {
    backgroundColor: '#485569',
  },
  stateBadgeText: {
    color: '#f6f9ff',
    fontSize: 12,
    fontWeight: '800',
  },
  statusType: {
    color: '#c2d8ff',
    fontSize: 16,
    fontWeight: '700',
  },
  statusMessage: {
    color: '#edf2fb',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  metaText: {
    color: '#8fa2c0',
    fontSize: 12,
  },
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
  sectionStack: {
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
    minHeight: 150,
    justifyContent: 'center',
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
  deviceRow: {
    alignItems: 'center',
    backgroundColor: '#111c2d',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  deviceRowSaved: {
    borderColor: '#5b80af',
    borderWidth: 1,
  },
  deviceName: {
    color: '#f3f8ff',
    fontSize: 15,
    fontWeight: '700',
  },
  deviceMeta: {
    color: '#88a0c4',
    fontSize: 12,
    marginTop: 4,
  },
  deviceSignal: {
    color: '#b9c9de',
    fontSize: 12,
    fontWeight: '700',
  },
});
