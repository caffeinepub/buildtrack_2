// Application-level utility functions

/**
 * Format a number as Tanzanian Shilling (Tsh)
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `Tsh ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `Tsh ${(value / 1_000).toFixed(0)}K`;
  }
  return `Tsh ${value.toLocaleString()}`;
}

/**
 * Convert a date string (YYYY-MM-DD) to nanoseconds (BigInt)
 */
export function dateToNs(dateStr: string): bigint {
  return BigInt(new Date(dateStr).getTime()) * 1_000_000n;
}

/**
 * Get current time in nanoseconds (BigInt)
 */
export function nowNs(): bigint {
  return BigInt(Date.now()) * 1_000_000n;
}

/**
 * Format nanoseconds timestamp to locale date string
 */
export function formatDate(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Convert nanoseconds to YYYY-MM-DD input format
 */
export function nsToDateInput(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toISOString().split("T")[0];
}
