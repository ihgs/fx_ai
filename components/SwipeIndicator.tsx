export type SwipeIndicatorProps = {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function SwipeIndicator({ count, activeIndex, onSelect }: SwipeIndicatorProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center gap-2">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`画面 ${i + 1}`}
          aria-current={i === activeIndex}
          onClick={() => onSelect(i)}
          className={`pointer-events-auto h-2.5 w-2.5 rounded-full transition-colors ${
            i === activeIndex ? "bg-white" : "bg-zinc-600"
          }`}
        />
      ))}
    </div>
  );
}
