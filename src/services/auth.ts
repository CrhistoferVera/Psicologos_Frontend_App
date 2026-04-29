import { apiFetch } from "./api";

export type User = {
  id: string;
  phoneNumber: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isProfileComplete: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string | null;
};

export type SendOtpResponse = { message: string };

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

export async function sendOtp(phoneNumber: string) {
  return apiFetch<SendOtpResponse>("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ phoneNumber }),
  });
}

export async function verifyOtp(phoneNumber: string, code: string) {
  return apiFetch<VerifyOtpResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phoneNumber, code }),
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

export async function forgotPassword(email: string) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
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
