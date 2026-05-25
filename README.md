# Dispositivo IoT antifurto

## Autor
- Mateus Alves de Oliveira
- devmateusalves@gmail.com

## Tecnologias
- Arduino
- ESP32
- C++
- React Native
- Expo
- Typescript

## Descrição

Dispositivo inteligente que identifica movimento, para simular um alarme de moto ou bicicleta.

## Estrutura

- `arduino.ino/esp32/esp32.ino`: firmware principal do ESP32 com MPU6050, BLE e persistencia da senha.
- `arduino.ino/arduino/arduino.ino`: versao Arduino da logica do dispositivo.
- `mobile/`: app mobile em React Native com Expo para Android.

## Bluetooth BLE do ESP32

O ESP32 agora anuncia o dispositivo `Guardmovel ESP32` com o servico BLE abaixo:

- Service UUID: `6d9f07f4-58f5-4f6f-b6a6-9d6f4f8d1000`
- Command Characteristic: `6d9f07f4-58f5-4f6f-b6a6-9d6f4f8d1001`
- Status Characteristic: `6d9f07f4-58f5-4f6f-b6a6-9d6f4f8d1002`

### Comandos aceitos

- `STATUS`
- `ARM|senha`
- `RESET|senha`
- `CHANGE_PASSWORD|senhaAtual|novaSenha|confirmacao`

### Respostas

O ESP32 notifica mensagens no formato `TIPO|ESTADO|mensagem`.

Exemplos:

- `STATE|IDLE|Estado atualizado`
- `CALIBRATING|IDLE|Calibrando MPU, mantenha o dispositivo parado`
- `ERROR|ALARM|Senha incorreta para resetar`
- `PASSWORD_CHANGED|IDLE|Senha alterada com sucesso`

## Senha

- Senha inicial: `123`
- A senha alterada e salva no armazenamento não volátil do ESP32.
- Depois de reiniciar a placa, a última senha continua válida.

## App mobile

O app fica em `mobile/` e foi preparado para Android com BLE.

### Requisitos

- Node.js instalado
- Expo CLI via `npx`
- Android Studio ou dispositivo Android fisico
- Dev build do Expo, porque BLE nao funciona no Expo Go

### Instalar dependencias

```bash
cd mobile
npm install
```

### Gerar projeto Android nativo

```bash
cd mobile
npx expo prebuild --platform android
```

### Rodar no Android

```bash
cd mobile
npm run android
```

### Validacao de tipos

```bash
cd mobile
npm exec tsc --noEmit
```
