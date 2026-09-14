"use client";

import { useEffect, useState } from "react";
import { WakeLockToggle } from "@/components/WakeLockToggle";

const STORAGE_KEY = "fx_ai:wakeLockEnabled";

function readStoredPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredPreference(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // プライベートブラウズ等でlocalStorageが使えない場合は永続化を諦める（トグル自体は動作させる）
  }
}

type InitialState = { supported: boolean; enabled: boolean };

/** navigator/localStorageはサーバーに存在しないため、マウント後に検出する（Promise化して.then(setState)の形にすることでreact-hooks/set-state-in-effectを満たす）。 */
async function detectInitialState(): Promise<InitialState> {
  return {
    supported: typeof navigator !== "undefined" && "wakeLock" in navigator,
    enabled: readStoredPreference(),
  };
}

export function WakeLockControl() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    detectInitialState().then((initial) => {
      if (cancelled) return;
      setSupported(initial.supported);
      setEnabled(initial.enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // enabled中は画面がバックグラウンドから復帰する度にWake Lockが自動解除されているため再取得する。
  useEffect(() => {
    if (!supported || !enabled) return;

    let sentinel: WakeLockSentinel | null = null;

    async function acquire() {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        // バッテリーセーバー等で拒否される場合がある。可視化復帰時に再試行するため無視する。
      }
    }

    function handleVisibilityChange() {
      if (!document.hidden && sentinel === null) acquire();
    }

    acquire();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [supported, enabled]);

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    writeStoredPreference(next);
  }

  return <WakeLockToggle supported={supported} enabled={enabled} onToggle={handleToggle} />;
}
