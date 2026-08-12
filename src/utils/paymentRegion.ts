type PaymentRegion = "BOLIVIA" | "INTERNATIONAL" | "UNKNOWN";
type PaymentCurrency = "BOB" | "USD" | null;

type PaymentRegionInput = {
  billingRegion?: string | null;
  preferredCurrency?: string | null;
  country?: string | null;
};

export type PaymentRegionResolution = {
  region: PaymentRegion;
  currency: PaymentCurrency;
  canUseQr: boolean;
  canUseStripe: boolean;
};

function normalizeValue(value?: string | null): string {
  return (value ?? "").trim().toUpperCase();
}

export function resolvePaymentRegion(input: PaymentRegionInput): PaymentRegionResolution {
  const billingRegion = normalizeValue(input.billingRegion);
  const preferredCurrency = normalizeValue(input.preferredCurrency);
  const country = normalizeValue(input.country);

  const isBolivia =
    billingRegion === "BOLIVIA" || preferredCurrency === "BOB" || country === "BO";

  if (isBolivia) {
    return {
      region: "BOLIVIA",
      currency: "BOB",
      canUseQr: true,
      canUseStripe: false,
    };
  }

  const isInternational =
    billingRegion === "INTERNATIONAL" ||
    preferredCurrency === "USD" ||
    (country.length > 0 && country !== "BO");

  if (isInternational) {
    return {
      region: "INTERNATIONAL",
      currency: "USD",
      canUseQr: false,
      canUseStripe: true,
    };
  }

  return {
    region: "UNKNOWN",
    currency: null,
    canUseQr: false,
    canUseStripe: false,
  };
}
