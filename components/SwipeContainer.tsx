"use client";

import { Children, useRef, useState, type ReactNode } from "react";
import { SwipeIndicator } from "@/components/SwipeIndicator";

type SwipeContainerProps = {
  children: ReactNode;
};

export function SwipeContainer({ children }: SwipeContainerProps) {
  const slides = Children.toArray(children);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll() {
    const el = containerRef.current;
    if (!el || el.clientWidth === 0) return;
    // 端末の慣性スクロールで中間値になっても最も近いスライドに丸める
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex((prev) => (prev === index ? prev : index));
  }

  function handleSelect(index: number) {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative h-screen w-full bg-black">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto"
      >
        {slides.map((slide, i) => (
          <div key={i} className="h-full w-full flex-shrink-0 snap-center">
            {slide}
          </div>
        ))}
      </div>
      <SwipeIndicator count={slides.length} activeIndex={activeIndex} onSelect={handleSelect} />
    </div>
  );
}
