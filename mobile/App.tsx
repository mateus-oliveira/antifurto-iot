import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
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
import { LAST_DEVICE_ID_KEY, LAST_DEVICE_NAME_KEY } from './src/constants/storage';
import { AppHeader } from './src/components/AppHeader';
import { ControlScreen } from './src/components/ControlScreen';
import { DeviceStatusCard } from './src/components/DeviceStatusCard';
import { NavigationTabs } from './src/components/NavigationTabs';
import { SearchScreen } from './src/components/SearchScreen';
import { SecurityScreen } from './src/components/SecurityScreen';
import { bleService } from './src/services/bleService';
import { appStyles } from './src/styles/appStyles';
import { NavigationTabsEnum, type Screen } from './src/types/navigation';

export default function App() {
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeScreen, setActiveScreen] = useState<Screen>(NavigationTabsEnum.SEARCH);
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
      bleService.stopScan();
      void bleService.disconnect();
    };
  }, []);

  const connectionLabel = connectedDevice ? `Conectado a ${connectedDevice.name ?? connectedDevice.localName ?? connectedDevice.id}` : 'Desconectado';
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
      setActiveScreen(NavigationTabsEnum.CONTROL);
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
      Alert.alert('Sem conexão', 'Conecte-se ao ESP32 antes de armar o alarme.');
      return;
    }

    if (!controlPassword.trim()) {
      Alert.alert('Senha obrigatória', 'Informe a senha para ativar o alarme.');
      return;
    }

    try {
      setIsBusy(true);
      await bleService.sendCommand(buildArmCommand(controlPassword));
      setStatusType('ARM');
      setStatusMessage('Comando de ativação enviado. Aguarde a calibração.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível ativar o alarme.';
      Alert.alert('Erro ao ativar', message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReset() {
    if (!connectedDevice) {
      Alert.alert('Sem conexão', 'Conecte-se ao ESP32 antes de resetar o alarme.');
      return;
    }

    if (!controlPassword.trim()) {
      Alert.alert('Senha obrigatória', 'Informe a senha para resetar o alarme.');
      return;
    }

    try {
      setIsBusy(true);
      await bleService.sendCommand(buildResetCommand(controlPassword));
      setStatusType('RESET');
      setStatusMessage('Comando de reset enviado.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível resetar o alarme.';
      Alert.alert('Erro ao resetar', message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleChangePassword() {
    if (!connectedDevice) {
      Alert.alert('Sem conexão', 'Conecte-se ao ESP32 antes de trocar a senha.');
      return;
    }

    if (!currentPassword.trim() || !nextPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha senha atual, nova senha e confirmação.');
      return;
    }

    if (nextPassword.trim() !== confirmPassword.trim()) {
      Alert.alert('Confirmação inválida', 'A confirmação precisa ser igual à nova senha.');
      return;
    }

    try {
      setIsBusy(true);
      await bleService.sendCommand(buildChangePasswordCommand(currentPassword, nextPassword, confirmPassword));
      setStatusType('PASSWORD');
      setStatusMessage('Solicitação de troca de senha enviada.');
      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível trocar a senha.';
      Alert.alert('Erro ao trocar senha', message);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <LinearGradient colors={["#08111f", "#12233a", "#223858"]} style={appStyles.background}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={appStyles.scrollContent}>
        <AppHeader />

        <DeviceStatusCard
          deviceState={deviceState}
          statusType={statusType}
          statusMessage={statusMessage}
          lastUpdateLabel={lastUpdateLabel}
        />

        <NavigationTabs activeScreen={activeScreen} onChangeScreen={setActiveScreen} />

        {activeScreen === NavigationTabsEnum.SEARCH ? (
          <SearchScreen
            devices={devices}
            isBusy={isBusy}
            isScanning={isScanning}
            savedDeviceId={savedDeviceId}
            savedDeviceName={savedDeviceName}
            onConnect={(device) => void handleConnect(device)}
            onReconnectSavedDevice={() => void handleReconnectSavedDevice()}
            onScan={() => void handleScan()}
          />
        ) : null}

        {activeScreen === NavigationTabsEnum.CONTROL ? (
          <ControlScreen
            connectionLabel={connectionLabel}
            controlPassword={controlPassword}
            deviceState={deviceState}
            isBusy={isBusy}
            isConnected={connectedDevice !== null}
            onArm={() => void handleArm()}
            onDisconnect={() => void handleDisconnect()}
            onReset={() => void handleReset()}
            onChangeControlPassword={setControlPassword}
          />
        ) : null}

        {activeScreen === NavigationTabsEnum.SECURITY ? (
          <SecurityScreen
            currentPassword={currentPassword}
            nextPassword={nextPassword}
            confirmPassword={confirmPassword}
            isBusy={isBusy}
            onChangeCurrentPassword={setCurrentPassword}
            onChangeNextPassword={setNextPassword}
            onChangeConfirmPassword={setConfirmPassword}
            onSavePassword={() => void handleChangePassword()}
          />
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}
