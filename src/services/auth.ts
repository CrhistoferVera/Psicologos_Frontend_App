import { apiFetch } from "./api";

export type User = {
  id: string;
  phoneNumber: string;
  phoneDialCode?: string | null;
  phoneNationalNumber?: string | null;
  phoneCountryIso?: string | null;
  phoneCountryName?: string | null;
  country?: string | null;
  billingRegion?: string | null;
  preferredCurrency?: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isProfileComplete: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string | null;
};

export type SendOtpResponse = { message: string };

export type PhoneRegistrationInput = {
  phoneDialCode: string;
  phoneNationalNumber: string;
  phoneCountryIso: string;
  phoneCountryName: string;
};

export type VerifyOtpResponse =
  | { access_token: string; user: User }
  | { needsProfile: true; tempToken: string };

export type CompleteRegistrationInput = {
  tempToken: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type CompleteRegistrationResponse = { access_token: string; user: User };
export type LoginResponse = { access_token: string; user: User };

export async function sendOtp(input: PhoneRegistrationInput) {
  const phoneNumber = `${input.phoneDialCode}${input.phoneNationalNumber}`;
  return apiFetch<SendOtpResponse>("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      phoneNumber,
    }),
  });
}

export async function verifyOtp(input: PhoneRegistrationInput, code: string) {
  const phoneNumber = `${input.phoneDialCode}${input.phoneNationalNumber}`;
  return apiFetch<VerifyOtpResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      phoneNumber,
      code,
    }),
  });
}

export async function completeRegistration(input: CompleteRegistrationInput) {
  return apiFetch<CompleteRegistrationResponse>("/auth/complete-registration", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getProfile() {
  return apiFetch<User>("/users/profile", { method: "GET" });
}

export async function loginWithEmail(email: string, password: string) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginWithGoogle(idToken: string) {
  return apiFetch<LoginResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function requestPasswordReset(email: string) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function forgotPassword(email: string) {
  return requestPasswordReset(email);
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });
}
