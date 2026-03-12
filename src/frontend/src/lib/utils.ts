import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(ns: bigint | number): string {
  const ms = typeof ns === "bigint" ? Number(ns) / 1_000_000 : ns / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function dateToNs(dateStr: string): bigint {
  return BigInt(new Date(dateStr).getTime()) * 1_000_000n;
}

export function nowNs(): bigint {
  return BigInt(Date.now()) * 1_000_000n;
}

export function nsToDateInput(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toISOString().split("T")[0];
}
