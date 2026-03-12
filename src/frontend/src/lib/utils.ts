import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// nanosecond timestamp -> formatted date string
export function formatDate(ns: bigint | number): string {
  const ms = typeof ns === "bigint" ? Number(ns) / 1_000_000 : ns / 1_000_000;
  if (!ms || Number.isNaN(ms)) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(ms));
}

// Date string "YYYY-MM-DD" -> nanoseconds bigint
export function dateToNs(dateStr: string): bigint {
  const ms = new Date(dateStr).getTime();
  return BigInt(ms) * BigInt(1_000_000);
}

// Current time as nanoseconds bigint
export function nowNs(): bigint {
  return BigInt(Date.now()) * BigInt(1_000_000);
}

// nanoseconds -> "YYYY-MM-DD" for date inputs
export function nsToDateInput(ns: bigint | number): string {
  const ms = typeof ns === "bigint" ? Number(ns) / 1_000_000 : ns / 1_000_000;
  if (!ms || Number.isNaN(ms)) return "";
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
