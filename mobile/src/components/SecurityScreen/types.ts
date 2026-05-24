export interface SecurityScreenProps {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
  isBusy: boolean;
  onChangeCurrentPassword: (value: string) => void;
  onChangeNextPassword: (value: string) => void;
  onChangeConfirmPassword: (value: string) => void;
  onSavePassword: () => void;
}