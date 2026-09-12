"use client";

import { useEffect, useState } from "react";
import { RateCard, type RateCardProps } from "@/components/RateCard";
import type { UsdJpyRate } from "@/lib/types";

/**
 * Pure data fetch — does not call setState itself. Callers (the mount
 * effect, the refresh button) apply the result via `.then(setState)`,
 * since setState inside a promise-chain callback is what
 * react-hooks/set-state-in-effect exempts (a setState call reachable
 * synchronously from an effect's own body is what it flags).
 */
async function loadRate(): Promise<RateCardProps> {
  try {
    const res = await fetch("/api/rate/usd-jpy");
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? `Request failed with status ${res.status}`);
    }
    const rate = (await res.json()) as UsdJpyRate;
    return { status: "loaded", rate };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function CurrentRateScreen() {
  const [state, setState] = useState<RateCardProps>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadRate().then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefresh = () => {
    setState({ status: "loading" });
    loadRate().then(setState);
  };

  const cardProps: RateCardProps =
    state.status === "loading" ? state : { ...state, onRefresh: handleRefresh };

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <RateCard {...cardProps} />
    </div>
  );
}
