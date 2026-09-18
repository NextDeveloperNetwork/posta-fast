/**
 * Currency formatting utility for Posta Fast
 * Currency is Albanian Lek (ALL)
 */

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") {
    return "0 ALL";
  }

  const numericValue = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericValue)) {
    return "0 ALL";
  }

  return `${new Intl.NumberFormat("sq-AL", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(numericValue)} ALL`;
}

export function parseCurrencyInput(value: string): number {
  const clean = value.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}
