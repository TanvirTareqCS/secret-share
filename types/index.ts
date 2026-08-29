export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}
export interface SecretData {
  text: string;
  passcode?: string;
  createdAt?: number;
}