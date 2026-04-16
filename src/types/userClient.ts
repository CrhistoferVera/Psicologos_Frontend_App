export interface UserClientData {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  isActive: boolean;
  wallet?: {
    balance: number | string;
  };
}
