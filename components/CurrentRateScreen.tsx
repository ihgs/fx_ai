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

const POLL_INTERVAL_MS = 60 * 1000;

/** 自動ポーリングでは取得成功時のみ表示を差し替え、失敗時は直前の表示を維持する（Req 1.2）。 */
export function nextStateAfterPoll(current: RateCardProps, polled: RateCardProps): RateCardProps {
  return polled.status === "loaded" ? polled : current;
}

export function CurrentRateScreen() {
  const [state, setState] = useState<RateCardProps>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    function poll() {
      loadRate().then((result) => {
        if (!cancelled) setState((current) => nextStateAfterPoll(current, result));
      });
    }

    function startPolling() {
      if (intervalId !== undefined) return;
      intervalId = setInterval(poll, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        poll();
        startPolling();
      }
    }

    loadRate().then((result) => {
      if (!cancelled) setState(result);
    });
    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
