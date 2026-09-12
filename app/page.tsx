"use client";

import { useEffect, useState } from "react";
import { RateCard, type RateCardProps } from "@/components/RateCard";
import type { UsdJpyRate } from "@/lib/types";

export default function Home() {
  const [state, setState] = useState<RateCardProps>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function fetchRate() {
      setState({ status: "loading" });
      try {
        const res = await fetch("/api/rate/usd-jpy");
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `Request failed with status ${res.status}`);
        }
        const rate = (await res.json()) as UsdJpyRate;
        if (!cancelled) setState({ status: "loaded", rate });
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    fetchRate();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-black p-6">
      <RateCard {...state} />
    </main>
  );
}
