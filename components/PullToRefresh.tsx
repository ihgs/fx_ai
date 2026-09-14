"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PullIndicator, type PullPhase } from "@/components/PullIndicator";

const PULL_THRESHOLD_PX = 64; // これを超えて引っ張ってから離すと更新が発火する
const MAX_PULL_PX = 96; // 見た目上の引っ張り量の上限
const PULL_RESISTANCE = 0.5; // 指の移動量に対する引っ張り量の減衰（ラバーバンド感）
const INDICATOR_HEIGHT_PX = 56;

type Phase = "idle" | PullPhase;

export type PullToRefreshProps = {
  /** 例外を投げない前提。失敗時の表示（エラーメッセージ等）は呼び出し元が状態として持つ。 */
  onRefresh: () => Promise<void>;
  /** trueの間はプル操作自体を無効化する（例: AI分析実行中）。 */
  disabled?: boolean;
  children: ReactNode;
};

export function PullToRefresh({ onRefresh, disabled = false, children }: PullToRefreshProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pullDistance, setPullDistance] = useState(0);

  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // ジェスチャーの状態はReactのstateではなくローカル変数で追跡する
    // （このeffectは一度だけ実行され、setState自体は表示更新のためだけに使う）。
    let startY: number | null = null;
    let dragging = false;
    let busy = false;
    let pulled = 0;

    function reset() {
      startY = null;
      dragging = false;
      pulled = 0;
      setPullDistance(0);
      setPhase("idle");
    }

    function handleTouchStart(e: TouchEvent) {
      if (disabledRef.current || busy) return;
      if (el!.scrollTop > 0) return;
      startY = e.touches[0].clientY;
    }

    function handleTouchMove(e: TouchEvent) {
      if (startY === null) return;
      const deltaY = e.touches[0].clientY - startY;

      if (deltaY <= 0 || el!.scrollTop > 0) {
        // 上方向に戻した、または既に通常スクロールが進んでいる場合は素通りさせる
        if (dragging) reset();
        else startY = null;
        return;
      }

      dragging = true;
      e.preventDefault();
      pulled = Math.min(deltaY * PULL_RESISTANCE, MAX_PULL_PX);
      setPullDistance(pulled);
      setPhase(pulled >= PULL_THRESHOLD_PX ? "ready" : "pulling");
    }

    function handleTouchEnd() {
      if (!dragging) {
        startY = null;
        return;
      }
      startY = null;
      dragging = false;

      if (pulled >= PULL_THRESHOLD_PX) {
        busy = true;
        setPhase("refreshing");
        setPullDistance(PULL_THRESHOLD_PX);
        onRefreshRef.current().finally(() => {
          busy = false;
          pulled = 0;
          setPhase("idle");
          setPullDistance(0);
        });
      } else {
        pulled = 0;
        setPhase("idle");
        setPullDistance(0);
      }
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    // preventDefault()を呼ぶためpassive:falseで登録する（Reactのon touchMoveはpassiveでpreventDefaultが効かない）。
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const dragActive = phase === "pulling" || phase === "ready";

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-x-0 top-0" style={{ height: INDICATOR_HEIGHT_PX }}>
        {phase !== "idle" && (
          <PullIndicator phase={phase} progress={Math.min(1, pullDistance / PULL_THRESHOLD_PX)} />
        )}
      </div>
      <div
        ref={scrollRef}
        className="h-full w-full overflow-y-auto"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: dragActive ? "none" : "transform 200ms ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
