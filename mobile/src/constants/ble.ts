export const BLE_DEVICE_NAME = 'Guardmovel ESP32';
export const BLE_SERVICE_UUID = '6d9f07f4-58f5-4f6f-b6a6-9d6f4f8d1000';
export const BLE_COMMAND_CHAR_UUID = '6d9f07f4-58f5-4f6f-b6a6-9d6f4f8d1001';
export const BLE_STATUS_CHAR_UUID = '6d9f07f4-58f5-4f6f-b6a6-9d6f4f8d1002';

export type DeviceState = 'IDLE' | 'ON_GUARD' | 'ALARM' | 'UNKNOWN';

export type StatusPacket = {
    type: string;
    state: DeviceState;
    message: string;
    raw: string;
};

export function buildArmCommand(password: string) {
    return `ARM|${password.trim()}`;
}

export function buildResetCommand(password: string) {
    return `RESET|${password.trim()}`;
}

export function buildChangePasswordCommand(currentPassword: string, newPassword: string, confirmPassword: string) {
    return `CHANGE_PASSWORD|${currentPassword.trim()}|${newPassword.trim()}|${confirmPassword.trim()}`;
}

export function buildStatusCommand() {
    return 'STATUS';
}

export function parseStatusPacket(raw: string): StatusPacket {
    const [type = 'UNKNOWN', state = 'UNKNOWN', ...messageParts] = raw.split('|');
    const normalizedState = state === 'IDLE' || state === 'ON_GUARD' || state === 'ALARM' ? state : 'UNKNOWN';

    return {
        type,
        state: normalizedState,
        message: messageParts.join('|') || 'Sem mensagem',
        raw,
    };
}
