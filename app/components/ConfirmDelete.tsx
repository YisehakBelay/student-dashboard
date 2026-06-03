export function ConfirmDelete({
  name,
  entity,
  onConfirm,
  onCancel,
  deleting,
}: {
  name: string | null;
  entity: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  if (!name) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          🗑️
        </div>
        <h2 className="text-lg font-bold text-slate-900">Delete {entity}?</h2>
        <p className="text-slate-500 text-sm mt-2 mb-6">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-slate-700">{name}</span>?
          <br />This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
