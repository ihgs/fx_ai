export type WakeLockToggleProps = {
  supported: boolean;
  enabled: boolean;
  onToggle: () => void;
};

export function WakeLockToggle({ supported, enabled, onToggle }: WakeLockToggleProps) {
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={`fixed right-4 top-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm ring-1 ring-white/10 transition-colors ${
        enabled ? "bg-white text-black" : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
      }`}
    >
      <span aria-hidden>{enabled ? "☀️" : "🌙"}</span>
      スリープ防止{enabled ? "ON" : "OFF"}
    </button>
  );
}
