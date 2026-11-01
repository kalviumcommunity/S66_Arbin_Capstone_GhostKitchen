import { useEffect, useId, useRef } from "react";

export default function WorkspaceDialog({ title, children, onClose, onSubmit, busy, error, submitLabel = "Save" }) {
  const id = useId();
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return <dialog ref={dialog} className="purchase-modal workspace-dialog" aria-labelledby={id} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={onSubmit}>
      <div className="modal-head"><h2 id={id}>{title}</h2><button type="button" className="modal-close" aria-label="Close dialog" disabled={busy} onClick={onClose}>×</button></div>
      {error ? <p role="alert" className="my-3 rounded-md bg-red-50 p-3 text-red-700">{error}</p> : null}
      <fieldset disabled={busy} className="min-w-0 border-0 p-0">{children}</fieldset>
      <div className="modal-actions"><button type="button" className="outline-btn" disabled={busy} onClick={onClose}>Close</button>{onSubmit ? <button type="submit" className="primary-btn" disabled={busy}>{busy ? "Saving…" : submitLabel}</button> : null}</div>
    </form>
  </dialog>;
}
