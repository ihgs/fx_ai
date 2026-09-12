"use client";

import { useCallback, useEffect, useState } from "react";
import { RateCard, type RateCardProps } from "@/components/RateCard";
import type { UsdJpyRate } from "@/lib/types";

export default function Home() {
  const [state, setState] = useState<RateCardProps>({ status: "loading" });

  const fetchRate = useCallback(async () => {
    setState({ status: "loading" });
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

  const cardProps: RateCardProps =
    state.status === "loading" ? state : { ...state, onRefresh: fetchRate };

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-black p-6">
      <RateCard {...cardProps} />
    </main>
  );
}
