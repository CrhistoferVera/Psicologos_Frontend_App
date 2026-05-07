import type { ReactElement } from "react";
import { StripeProvider } from "@stripe/stripe-react-native";
import { STRIPE_PUBLISHABLE_KEY } from "../config";

type StripeProviderWrapperProps = {
  children: ReactElement | ReactElement[];
};

export default function StripeProviderWrapper({ children }: StripeProviderWrapperProps) {
  return <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>{children}</StripeProvider>;
}
