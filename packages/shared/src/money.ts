export const BRL = "BRL";

export function assertNonNegativeCents(cents: number): void {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error("INVALID_AMOUNT_CENTS");
  }
}

export function formatBrlFromCents(cents: number): string {
  assertNonNegativeCents(cents);
  const sign = "";
  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, "0");
  return `${sign}R$ ${whole},${fraction}`;
}

export function addCents(a: number, b: number): number {
  assertNonNegativeCents(a);
  assertNonNegativeCents(b);
  return a + b;
}
