import type { ReactNode } from "react";
import { StripeProvider } from "@stripe/stripe-react-native";
import { STRIPE_PUBLISHABLE_KEY } from "../config";

export default function StripeProviderWrapper({ children }: { children: ReactNode }) {
  return <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>{children}</StripeProvider>;
}
