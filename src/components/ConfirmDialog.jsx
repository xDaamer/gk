import { TriangleAlert } from 'lucide-react'

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  danger = false,
  disabled = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-[var(--surface-card)] p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              danger ? 'bg-red-600/10 text-red-600' : 'bg-[var(--brass-soft)] text-[var(--brass)]'
            }`}
          >
            <TriangleAlert size={18} />
          </span>
          <div>
            <h3 className="font-display text-base font-medium text-[var(--ink)]">{title}</h3>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-black/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className={`rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
              danger
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-bg-hover)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
