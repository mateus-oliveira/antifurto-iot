#include <Wire.h>
#include <string.h>

/* Pin Definitions */
// Arduino Uno/Nano: I2C on A4 (SDA) and A5 (SCL)
#define RLED_PIN     4
#define YLED_PIN    12
#define BUZZER_PIN   2
#define MPU_ADDR  0x68

/* Password */
#define PASSWORD "123"

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

/* States */
enum DeviceState { 
  IDLE,     // waiting for arm command — RLED constant on
  ON_GUARD, // calibrated and monitoring movement — RLED blinks 1s
  ALARM     // suspicious movement detected — RLED blinks fast, buzzer on
};
DeviceState deviceState = IDLE;

/* Password Input */
// Actions that require a password before executing
enum PendingAction { NONE, ACT_ARM, ACT_RESET };
PendingAction pendingAction = NONE;
char passwordBuffer[16];
int passwordIndex = 0;
bool waitingPassword = false;

/* MPU6050 Baseline */
long baseX = 0, baseY = 0, baseZ = 0;

/* Non-blocking Timing */
unsigned long lastLedToggle   = 0;
unsigned long lastMotionCheck = 0;
bool rLedState = false;

/* Consecutive-trigger Counter */
int triggerCount = 0;

/* Setup */
void setup() {
  Serial.begin(9600);

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

  setState(IDLE);
  printHelp();
}

/* Loop */
void loop() {
  if (Serial.available() > 0) {
    char c = (char)Serial.read();

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

        case '?':
          printHelp();
          break;
      }
    }
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
  Serial.println("[SENHA] Digite a senha e pressione Enter:");
  Serial.println("        (certifique-se de usar 'Newline' no Serial Monitor)");
}

// Accumulates characters; processes the password when Enter (\n or \r) is received.
void handlePasswordInput(char c) {
  if (c == '\n' || c == '\r') {
    if (passwordIndex == 0) return;  // ignore bare Enter with empty buffer

    passwordBuffer[passwordIndex] = '\0';

    if (strcmp(passwordBuffer, PASSWORD) == 0) {
      onPasswordCorrect();
    } else {
      onPasswordWrong();
    }

    waitingPassword = false;
    pendingAction   = NONE;
    passwordIndex   = 0;
    memset(passwordBuffer, 0, sizeof(passwordBuffer));

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
      Serial.println("[MPU] Calibrando — mantenha o dispositivo parado...");
      // YLED stays on during calibration to signal the user to keep still
      calibrateMPU();
      Serial.print("[MPU] Baseline — X: ");
      Serial.print(baseX);
      Serial.print("  Y: ");
      Serial.print(baseY);
      Serial.print("  Z: ");
      Serial.println(baseZ);
      setState(ON_GUARD);   // YLED turned off inside setState
      break;

    case ACT_RESET:
      setState(IDLE);
      break;

    default:
      break;
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
      break;

    case ON_GUARD:
      noTone(BUZZER_PIN);
      digitalWrite(YLED_PIN, LOW);    // YLED off (was on during password/calibration)
      rLedState = false;
      Serial.println("[STATE] -> ON_GUARD — monitorando movimento...");
      break;

    case ALARM:
      tone(BUZZER_PIN, 50);         // 1 kHz continuous tone
      digitalWrite(YLED_PIN, LOW);
      rLedState = false;
      Serial.println("[STATE] -> ALARME — movimento suspeito detectado!");
      Serial.println("           Use 'r' para resetar (requer senha).");
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
      // RLED rapid blink: 100 ms period
      if (now - lastLedToggle >= 100) {
        rLedState = !rLedState;
        digitalWrite(RLED_PIN, rLedState);
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
  Serial.println("  a / A  ->  Armar      (IDLE -> ON_GUARD, requer senha)");
  Serial.println("  r / R  ->  Resetar    (AnyState -> IDLE,    requer senha)");
  Serial.println("  ?      ->  Esta ajuda");
  Serial.println("  Senha padrão: 123");
  Serial.println("==============================");
}
