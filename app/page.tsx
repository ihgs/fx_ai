"use client";

import { useCallback, useEffect, useState } from "react";
import { RateCard, type RateCardProps } from "@/components/RateCard";
import type { UsdJpyRate } from "@/lib/types";

export default function Home() {
  const [state, setState] = useState<RateCardProps>({ status: "loading" });

  // Note: no setState call before the first `await` here — a synchronous
  // setState in an effect's call chain trips react-hooks/set-state-in-effect.
  // The initial "loading" state comes from useState's initial value instead.
  const fetchRate = useCallback(async () => {
    try {
      const res = await fetch("/api/rate/usd-jpy");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Request failed with status ${res.status}`);
      }
      const rate = (await res.json()) as UsdJpyRate;
      setState({ status: "loaded", rate });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, []);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  // Resetting to "loading" happens here instead, since this only ever runs
  // from the button's click handler, not from the effect above.
  const handleRefresh = useCallback(() => {
    setState({ status: "loading" });
    fetchRate();
  }, [fetchRate]);

  const cardProps: RateCardProps =
    state.status === "loading" ? state : { ...state, onRefresh: handleRefresh };

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-black p-6">
      <RateCard {...cardProps} />
    </main>
  );
}
