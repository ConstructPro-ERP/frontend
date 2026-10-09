"use client";

import { useEffect, useId, useRef } from "react";
import { Trash2 } from "lucide-react";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  pending = false,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  pending?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      aria-busy={pending}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-outline-variant bg-white p-6 text-on-surface shadow-level-2 backdrop:bg-slate-950/45"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-error-container text-error">
        <Trash2 size={22} aria-hidden="true" />
      </div>
      <h2 id={titleId} className="text-lg font-bold">
        {title}
      </h2>
      <p
        id={messageId}
        className="mt-2 break-words text-sm text-on-surface-variant"
      >
        {message}
      </p>
      {error ? (
        <p role="alert" className="mt-4 break-words text-sm text-error">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          autoFocus
          disabled={pending}
          onClick={onCancel}
          className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold hover:bg-surface-container disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
