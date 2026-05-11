function toSafeNumber(value: number | string | null | undefined): number {
  const numeric = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function formatBob(value: number | string | null | undefined, includeCode = false): string {
  const amount = toSafeNumber(value);
  const formatted = amount.toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return includeCode ? `Bs ${formatted} BOB` : `Bs ${formatted}`;
}

export function formatUsd(value: number | string | null | undefined, includeCode = false): string {
  const amount = toSafeNumber(value);
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return includeCode ? `$ ${formatted} USD` : `$ ${formatted}`;
}

export function formatMoneyByCurrency(
  value: number | string | null | undefined,
  currency: "BOB" | "USD" | null | undefined,
  includeCode = false,
): string {
  if (currency === "USD") return formatUsd(value, includeCode);
  return formatBob(value, includeCode);
}
