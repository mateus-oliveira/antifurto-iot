#include <Wire.h>
#include <Preferences.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <string.h>

/* Pin Definitions
 * Wemos D1 R32 (ESP32): same physical connector positions as Arduino Uno
 *   Arduino D2  → GPIO26   (BUZZER)
 *   Arduino D4  → GPIO17   (RLED)
 *   Arduino D12 → GPIO19   (YLED)
 *   Arduino A4  → GPIO21   (SDA — Wire default on ESP32)
 *   Arduino A5  → GPIO22   (SCL — Wire default on ESP32)
*/
#define RLED_PIN    17
#define YLED_PIN    19
#define BUZZER_PIN  26
#define MPU_ADDR  0x68

/* BLE */
#define BLE_DEVICE_NAME        "Guardmovel ESP32"
#define BLE_SERVICE_UUID       "6d9f07f4-58f5-4f6f-b6a6-9d6f4f8d1000"
#define BLE_COMMAND_CHAR_UUID  "6d9f07f4-58f5-4f6f-b6a6-9d6f4f8d1001"
#define BLE_STATUS_CHAR_UUID   "6d9f07f4-58f5-4f6f-b6a6-9d6f4f8d1002"

/* Persistence */
#define PREFS_NAMESPACE        "guardmovel"
#define PREFS_PASSWORD_KEY     "password"

/* Password */
char currentPassword[16] = "123";

/* Motion Detection */
// 200 samples × 10 ms = ~2 s of calibration
#define CALIBRATION_SAMPLES   200
// Tune this value to adjust sensitivity.
// MPU6050 at default ±2g: 1g ≈ 16384 raw units.
// 4000 ≈ 0.24g — detects a clear shake, ignores small vibrations.
#define MOVEMENT_THRESHOLD    4000
// How many consecutive readings above threshold trigger the alarm
#define CONSECUTIVE_TRIGGERS  3
// Milliseconds between motion samples (keeps loop() non-blocking)
#define MOTION_CHECK_INTERVAL 100

/* Enums */
enum DeviceState { 
  IDLE,     // waiting for arm command — RLED constant on
  ON_GUARD, // calibrated and monitoring movement — RLED blinks 1s
  ALARM     // suspicious movement detected — RLED blinks fast, buzzer on
};
enum PendingAction { NONE, ACT_ARM, ACT_RESET, ACT_CHANGE_PWD };
enum PwdChangeStep { CS_IDLE, CS_CURRENT, CS_NEW, CS_CONFIRM };

/* Password and State */
DeviceState deviceState = IDLE;
PendingAction pendingAction = NONE;
PwdChangeStep pwdChangeStep = CS_IDLE;  // sub-step for ACT_CHANGE_PWD
int passwordIndex = 0;
char passwordBuffer[16];
char newPasswordBuffer[16];        // holds candidate new password during change flow
bool waitingPassword = false;

/* BLE and Persistence */
Preferences preferences;
BLECharacteristic *statusCharacteristic = nullptr;
bool bleClientConnected = false;
volatile bool bleCommandPending = false;
char bleCommandBuffer[96];

/* MPU6050 Baseline */
long baseX = 0, baseY = 0, baseZ = 0;

/* Non-blocking Timing */
unsigned long lastLedToggle   = 0;
unsigned long lastMotionCheck = 0;
bool rLedState = false;

/* Consecutive-trigger Counter */
int triggerCount = 0;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    bleClientConnected = true;
  }

  void onDisconnect(BLEServer *server) override {
    bleClientConnected = false;
    server->getAdvertising()->start();
  }
};

class CommandCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) override {
    std::string value = characteristic->getValue();
    size_t length = value.length();
    if (length == 0) {
      return;
    }

    if (length >= sizeof(bleCommandBuffer)) {
      length = sizeof(bleCommandBuffer) - 1;
    }

    memcpy(bleCommandBuffer, value.c_str(), length);
    bleCommandBuffer[length] = '\0';
    bleCommandPending = true;
  }
};

/* Setup */
void setup() {
  Serial.begin(115200);

  pinMode(RLED_PIN, OUTPUT);
  pinMode(YLED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(RLED_PIN, LOW);
  digitalWrite(YLED_PIN, LOW);

  // MPU6050: wake up from sleep mode
  Wire.begin();
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0);
  Wire.endTransmission(true);

  loadPassword();
  setupBLE();

  setState(IDLE);
  printHelp();
  sendStatus("READY", "Dispositivo pronto para conexao BLE");
}

/* Loop */
void loop() {
  if (Serial.available() > 0) {
    char c = (char) Serial.read();

    if (waitingPassword) {
      handlePasswordInput(c);
    } else {
      switch (c) {
        case 'a': case 'A':
          if (deviceState == IDLE) {
            enterPasswordMode(ACT_ARM);
          } else {
            Serial.println("[CMD] 'a' disponível apenas no estado IDLE");
          }
          break;

        case 'r': case 'R':
          enterPasswordMode(ACT_RESET);
          break;

        case 'p': case 'P':
          if (deviceState == IDLE) {
            enterPasswordMode(ACT_CHANGE_PWD);
          } else {
            Serial.println("[CMD] 'p' disponível apenas no estado IDLE");
          }
          break;

        case 'h': case 'H':
          printHelp();
          break;
      }
    }
  }

  if (bleCommandPending) {
    processBluetoothCommand();
  }

  updateRLED();

  // Motion monitoring: only active in ON_GUARD and not waiting for password input
  if (deviceState != ON_GUARD || waitingPassword) {
    triggerCount = 0;
    return;
  }

  unsigned long now = millis();
  if (now - lastMotionCheck < MOTION_CHECK_INTERVAL) return;
  lastMotionCheck = now;

  int16_t ax, ay, az;
  readMPU(ax, ay, az);

  long dX = (long)ax - baseX;
  long dY = (long)ay - baseY;
  long dZ = (long)az - baseZ;
  long magnitude = (long)sqrt((double)(dX * dX + dY * dY + dZ * dZ));

  if (magnitude > MOVEMENT_THRESHOLD) {
    triggerCount++;
    Serial.print("[MPU] Movimento: mag=");
    Serial.print(magnitude);
    Serial.print("  trigger ");
    Serial.print(triggerCount);
    Serial.print("/");
    Serial.println(CONSECUTIVE_TRIGGERS);

    if (triggerCount >= CONSECUTIVE_TRIGGERS) {
      setState(ALARM);
    }
  } else {
    triggerCount = 0;
  }
}

/* Password Mode */
void enterPasswordMode(PendingAction action) {
  pendingAction    = action;
  waitingPassword  = true;
  passwordIndex    = 0;
  memset(passwordBuffer, 0, sizeof(passwordBuffer));
  digitalWrite(RLED_PIN, LOW);
  digitalWrite(YLED_PIN, HIGH);
  if (action == ACT_CHANGE_PWD) {
    pwdChangeStep = CS_CURRENT;
    Serial.println("[SENHA] Digite a senha atual:");
  } else {
    Serial.println("[SENHA] Digite a senha e pressione Enter:");
  }
}

// Accumulates characters; processes the password when Enter (\n or \r) is received.
void handlePasswordInput(char c) {
  if (c == '\n' || c == '\r') {
    if (passwordIndex == 0) return;  // ignore bare Enter with empty buffer

    passwordBuffer[passwordIndex] = '\0';

    if (pendingAction == ACT_CHANGE_PWD) {
      handleChangePasswordStep();
    } else {
      if (strcmp(passwordBuffer, currentPassword) == 0) {
        onPasswordCorrect();
      } else {
        onPasswordWrong();
      }
      waitingPassword = false;
      pendingAction   = NONE;
      passwordIndex   = 0;
      memset(passwordBuffer, 0, sizeof(passwordBuffer));
    }

  } else {
    // Append character (leave room for null terminator)
    if (passwordIndex < (int)(sizeof(passwordBuffer) - 1)) {
      passwordBuffer[passwordIndex++] = c;
    }
  }
}

void onPasswordCorrect() {
  Serial.println("[SENHA] Correta.");

  digitalWrite(YLED_PIN, HIGH);
  digitalWrite(RLED_PIN, HIGH);

  switch (pendingAction) {
    case ACT_ARM:
      armSystem();
      break;

    case ACT_RESET:
      resetSystem();
      break;

    default:
      break;
  }
}

// ─── Change Password Flow ────────────────────────────────────────────────────
// Called on each Enter press while pendingAction == ACT_CHANGE_PWD.
// pwdChangeStep 1 = current password, 2 = new password, 3 = confirm new password.
void handleChangePasswordStep() {
  switch (pwdChangeStep) {
    case CS_CURRENT:  // verify current password
      if (strcmp(passwordBuffer, currentPassword) == 0) {
        Serial.println("[SENHA] Correta. Digite a nova senha:");
        pwdChangeStep = CS_NEW;
        passwordIndex = 0;
        memset(passwordBuffer, 0, sizeof(passwordBuffer));
      } else {
        Serial.println("[SENHA] Incorreta — troca cancelada.");
        onPasswordWrong();
        pwdChangeStep   = CS_IDLE;
        waitingPassword = false;
        pendingAction   = NONE;
        passwordIndex   = 0;
        memset(passwordBuffer,    0, sizeof(passwordBuffer));
        memset(newPasswordBuffer, 0, sizeof(newPasswordBuffer));
        setState(IDLE);
      }
      break;

    case CS_NEW:
      memcpy(newPasswordBuffer, passwordBuffer, sizeof(newPasswordBuffer));
      Serial.println("[SENHA] Confirme a nova senha:");
      pwdChangeStep = CS_CONFIRM;
      passwordIndex = 0;
      memset(passwordBuffer, 0, sizeof(passwordBuffer));
      break;

    case CS_CONFIRM:
      if (strcmp(passwordBuffer, newPasswordBuffer) == 0) {
        pwdChangeStep   = CS_IDLE;
        waitingPassword = false;
        pendingAction   = NONE;
        passwordIndex   = 0;
        memset(passwordBuffer,    0, sizeof(passwordBuffer));
        memset(newPasswordBuffer, 0, sizeof(newPasswordBuffer));
        if (changePassword(currentPassword, newPasswordBuffer, newPasswordBuffer)) {
          onPasswordChangeSuccess();
          setState(IDLE);
        } else {
          onPasswordWrong();
          setState(IDLE);
        }
      } else {
        Serial.println("[SENHA] Senhas não coincidem — troca cancelada.");
        onPasswordWrong();
        pwdChangeStep   = CS_IDLE;
        waitingPassword = false;
        pendingAction   = NONE;
        passwordIndex   = 0;
        memset(passwordBuffer,    0, sizeof(passwordBuffer));
        memset(newPasswordBuffer, 0, sizeof(newPasswordBuffer));
        setState(IDLE);
      }
      break;

    default:
      break;
  }
}

void onPasswordChangeSuccess() {
  Serial.println("[SENHA] Senha alterada com sucesso!");
  // YLED blinks 3× fast — distinct positive feedback
  for (int i = 0; i < 3; i++) {
    digitalWrite(YLED_PIN, HIGH);
    delay(100);
    digitalWrite(YLED_PIN, LOW);
    delay(100);
  }
}

// Blinks YLED `times` times with `intervalMs` on/off duration.
// Blocking — intended only for short feedback sequences.
void onPasswordWrong() {
  Serial.println("[SENHA] Incorreta — estado mantido.");
  int times = 2;
  int intervalMs = 200;
  for (int i = 0; i < times; i++) {
    digitalWrite(YLED_PIN, HIGH);
    digitalWrite(RLED_PIN, HIGH);
    delay(intervalMs);
    digitalWrite(YLED_PIN, LOW);
    digitalWrite(RLED_PIN, LOW);
    delay(intervalMs);
  }
}

/* State Machine */
void setState(DeviceState newState) {
  deviceState  = newState;
  triggerCount = 0;
  rLedState    = false;
  lastLedToggle = millis();

  switch (newState) {
    case IDLE:
      noTone(BUZZER_PIN);
      digitalWrite(RLED_PIN, HIGH);   // RLED constant on
      digitalWrite(YLED_PIN, LOW);
      Serial.println("[STATE] -> IDLE");
      sendStateStatus();
      break;

    case ON_GUARD:
      noTone(BUZZER_PIN);
      digitalWrite(YLED_PIN, LOW);    // YLED off (was on during password/calibration)
      rLedState = false;
      Serial.println("[STATE] -> ON_GUARD — monitorando movimento...");
      sendStateStatus();
      break;

    case ALARM:
      tone(BUZZER_PIN, 50);         // 1 kHz continuous tone
      digitalWrite(YLED_PIN, LOW);
      rLedState = false;
      Serial.println("[STATE] -> ALARME — movimento suspeito detectado!");
      Serial.println("           Use 'r' para resetar (requer senha).");
      sendStateStatus();
      break;
  }
}

/* LED Patterns (non-blocking) */
void updateRLED() {
  unsigned long now = millis();

  if (waitingPassword){
    digitalWrite(RLED_PIN, LOW);
    return;
  }

  switch (deviceState) {
    case IDLE:
      digitalWrite(RLED_PIN, HIGH);   // constant on
      break;

    case ON_GUARD:
      // RLED slow blink: 1 s period
      if (now - lastLedToggle >= 1000) {
        rLedState = !rLedState;
        digitalWrite(RLED_PIN, rLedState);
        lastLedToggle = now;
      }
      break;

    case ALARM:
      // RLED and YLED rapid blink: 100 ms period
      if (now - lastLedToggle >= 100) {
        rLedState = !rLedState;
        digitalWrite(RLED_PIN, rLedState);
        digitalWrite(YLED_PIN, !rLedState);
        lastLedToggle = now;
      }
      break;
  }
}

/* Calibration */
void calibrateMPU() {
  long sumX = 0, sumY = 0, sumZ = 0;
  for (int i = 0; i < CALIBRATION_SAMPLES; i++) {
    int16_t ax, ay, az;
    readMPU(ax, ay, az);
    sumX += ax;
    sumY += ay;
    sumZ += az;
    delay(10);
  }
  baseX = sumX / CALIBRATION_SAMPLES;
  baseY = sumY / CALIBRATION_SAMPLES;
  baseZ = sumZ / CALIBRATION_SAMPLES;
}

/* MPU6050 Read */
void readMPU(int16_t &ax, int16_t &ay, int16_t &az) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);
  ax = Wire.read() << 8 | Wire.read();
  ay = Wire.read() << 8 | Wire.read();
  az = Wire.read() << 8 | Wire.read();
}

/* Serial Help */
void printHelp() {
  Serial.println("==============================");
  Serial.println("Comandos (Serial Monitor):");
  Serial.println("  a / A  ->  Armar         (IDLE -> ON_GUARD, requer senha)");
  Serial.println("  r / R  ->  Resetar       (AnyState -> IDLE,    requer senha)");
  Serial.println("  p / P  ->  Alterar senha (apenas no estado IDLE)");
  Serial.println("  h / H  ->  Esta ajuda");
  Serial.println("  Senha padrão: 123");
  Serial.println("BLE commands:");
  Serial.println("  ARM|senha");
  Serial.println("  RESET|senha");
  Serial.println("  CHANGE_PASSWORD|senhaAtual|novaSenha|confirmacao");
  Serial.println("  STATUS");
  Serial.println("==============================");
}

void loadPassword() {
  preferences.begin(PREFS_NAMESPACE, false);
  String storedPassword = preferences.getString(PREFS_PASSWORD_KEY, currentPassword);
  storedPassword.trim();

  if (storedPassword.length() == 0) {
    strlcpy(currentPassword, "123", sizeof(currentPassword));
    savePassword();
    return;
  }

  storedPassword.toCharArray(currentPassword, sizeof(currentPassword));
}

void savePassword() {
  preferences.putString(PREFS_PASSWORD_KEY, currentPassword);
}

void setupBLE() {
  BLEDevice::init(BLE_DEVICE_NAME);
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  BLEService *service = server->createService(BLE_SERVICE_UUID);

  BLECharacteristic *commandCharacteristic = service->createCharacteristic(
    BLE_COMMAND_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
  );
  commandCharacteristic->setCallbacks(new CommandCallbacks());

  statusCharacteristic = service->createCharacteristic(
    BLE_STATUS_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  statusCharacteristic->addDescriptor(new BLE2902());
  statusCharacteristic->setValue("READY|Inicializando");

  service->start();

  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(BLE_SERVICE_UUID);
  advertising->setScanResponse(true);
  advertising->setMinPreferred(0x06);
  advertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
}

void sendStatus(const char *type, const char *message) {
  if (statusCharacteristic == nullptr) {
    return;
  }

  char payload[96];
  snprintf(payload, sizeof(payload), "%s|%s|%s", type, stateToString(deviceState), message);
  statusCharacteristic->setValue((uint8_t *)payload, strlen(payload));
  if (bleClientConnected) {
    statusCharacteristic->notify();
  }
  Serial.print("[BLE] ");
  Serial.println(payload);
}

void sendStateStatus() {
  sendStatus("STATE", "Estado atualizado");
}

void processBluetoothCommand() {
  bleCommandPending = false;
  processProtocolCommand(bleCommandBuffer);
  memset(bleCommandBuffer, 0, sizeof(bleCommandBuffer));
}

bool verifyPassword(const char *password) {
  return password != nullptr && strcmp(password, currentPassword) == 0;
}

void clearPasswordFlow() {
  pwdChangeStep = CS_IDLE;
  waitingPassword = false;
  pendingAction = NONE;
  passwordIndex = 0;
  memset(passwordBuffer, 0, sizeof(passwordBuffer));
  memset(newPasswordBuffer, 0, sizeof(newPasswordBuffer));
}

void armSystem() {
  if (deviceState != IDLE) {
    sendStatus("ERROR", "Armar permitido apenas em IDLE");
    return;
  }

  sendStatus("CALIBRATING", "Calibrando MPU, mantenha o dispositivo parado");
  Serial.println("[MPU] Calibrando — mantenha o dispositivo parado...");
  calibrateMPU();
  Serial.print("[MPU] Baseline — X: ");
  Serial.print(baseX);
  Serial.print("  Y: ");
  Serial.print(baseY);
  Serial.print("  Z: ");
  Serial.println(baseZ);
  setState(ON_GUARD);
}

void resetSystem() {
  setState(IDLE);
}

bool changePassword(const char *current, const char *next, const char *confirm) {
  if (!verifyPassword(current)) {
    sendStatus("ERROR", "Senha atual incorreta");
    return false;
  }

  if (next == nullptr || confirm == nullptr || strlen(next) == 0) {
    sendStatus("ERROR", "Nova senha invalida");
    return false;
  }

  if (strlen(next) >= sizeof(currentPassword)) {
    sendStatus("ERROR", "Nova senha excede o limite de 15 caracteres");
    return false;
  }

  if (strcmp(next, confirm) != 0) {
    sendStatus("ERROR", "Confirmacao de senha divergente");
    return false;
  }

  strlcpy(currentPassword, next, sizeof(currentPassword));
  savePassword();
  sendStatus("PASSWORD_CHANGED", "Senha alterada com sucesso");
  return true;
}

void processProtocolCommand(char *commandLine) {
  if (commandLine == nullptr || commandLine[0] == '\0') {
    sendStatus("ERROR", "Comando vazio");
    return;
  }

  char *cursor = commandLine;
  char *command = nextToken(cursor);
  if (command == nullptr) {
    sendStatus("ERROR", "Comando invalido");
    return;
  }

  if (strcasecmp(command, "STATUS") == 0) {
    sendStateStatus();
    return;
  }

  if (strcasecmp(command, "ARM") == 0) {
    char *password = nextToken(cursor);
    if (!verifyPassword(password)) {
      onPasswordWrong();
      sendStatus("ERROR", "Senha incorreta para armar");
      return;
    }
    armSystem();
    return;
  }

  if (strcasecmp(command, "RESET") == 0) {
    char *password = nextToken(cursor);
    if (!verifyPassword(password)) {
      onPasswordWrong();
      sendStatus("ERROR", "Senha incorreta para resetar");
      return;
    }
    resetSystem();
    sendStatus("SUCCESS", "Alarme resetado");
    return;
  }

  if (strcasecmp(command, "CHANGE_PASSWORD") == 0) {
    char *current = nextToken(cursor);
    char *next = nextToken(cursor);
    char *confirm = nextToken(cursor);
    if (changePassword(current, next, confirm)) {
      onPasswordChangeSuccess();
      setState(IDLE);
      return;
    }

    onPasswordWrong();
    return;
  }

  sendStatus("ERROR", "Comando desconhecido");
}

char *nextToken(char *&cursor) {
  if (cursor == nullptr) {
    return nullptr;
  }

  while (*cursor == ' ') {
    cursor++;
  }

  if (*cursor == '\0') {
    return nullptr;
  }

  char *tokenStart = cursor;
  while (*cursor != '\0' && *cursor != '|') {
    cursor++;
  }

  if (*cursor == '|') {
    *cursor = '\0';
    cursor++;
  }

  return tokenStart;
}

const char *stateToString(DeviceState state) {
  switch (state) {
    case IDLE:
      return "IDLE";
    case ON_GUARD:
      return "ON_GUARD";
    case ALARM:
      return "ALARM";
    default:
      return "UNKNOWN";
  }
}
