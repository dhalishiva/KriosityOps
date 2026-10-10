import { useEffect, useRef, type ReactNode } from 'react';

/** Native <dialog> with focus handling and Escape to close. */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="dlg"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="dlg-title"
    >
      <div className="dlg-inner">
        <div className="dlg-head">
          <h2 id="dlg-title">{title}</h2>
          <button type="button" className="btn btn-quiet btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
