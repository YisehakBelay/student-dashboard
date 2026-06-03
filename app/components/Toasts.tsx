import { ToastItem } from "../types";

export function Toasts({
  items,
  onRemove,
}: {
  items: ToastItem[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium min-w-72 pointer-events-auto ${
            t.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          <span className="text-base">{t.type === "success" ? "✓" : "✕"}</span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="opacity-60 hover:opacity-100 text-xs">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
