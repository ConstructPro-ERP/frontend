"use client";

import { useRef, useState, type FormEvent } from "react";
import type { DocumentCategory } from "@/types/document";
import { uploadDocument } from "@/services/documentsApi";
import {
  DOCUMENT_ACCEPT,
  formatFileSize,
  validateDocumentFile,
  validateDocumentMetadata,
} from "@/lib/projectDocumentRules";
import {
  Modal,
  Notice,
  buttonClass,
  primaryClass,
  inputClass,
  errorMessage,
} from "./ProjectUI";

export default function DocumentUploadModal({
  projectId,
  categories,
  onClose,
  onSaved,
}: {
  projectId: string;
  categories: DocumentCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const validation =
      validateDocumentFile(file) ??
      validateDocumentMetadata({ fileName: file?.name ?? "", categoryId });
    if (validation || !file) {
      setError(validation ?? "Choose a file.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    setProgress(0);
    try {
      await uploadDocument(projectId, file, categoryId, setProgress);
      onSaved();
      onClose();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Modal title="Upload project document" onClose={onClose} busy={busy}>
      <form onSubmit={submit} className="space-y-5 p-5">
        {error && <Notice error>{error}</Notice>}
        <fieldset disabled={busy} className="space-y-4">
          <label className="block text-sm font-semibold">
            File <span aria-hidden="true">*</span>
            <input
              type="file"
              required
              accept={DOCUMENT_ACCEPT}
              className={inputClass + " mt-2"}
              aria-describedby="document-file-help"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setError(
                  selected ? (validateDocumentFile(selected) ?? "") : "",
                );
              }}
            />
          </label>
          <p id="document-file-help" className="text-xs text-on-surface-muted">
            Supports PDF, Office documents, CAD, Revit, Lumion, 3D models,
            images, and archives. Maximum 50 MiB per file. Files up to 3 MiB use
            standard upload; larger files upload directly.
          </p>
          {file && (
            <p className="break-all text-sm">
              {file.name} · {formatFileSize(file.size)}
            </p>
          )}
          <label className="block text-sm font-semibold">
            Category <span aria-hidden="true">*</span>
            <select
              required
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={inputClass + " mt-2"}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
        {busy && (
          <div role="status" className="space-y-2 text-sm">
            <p>
              {progress === 100
                ? "Processing document..."
                : `Uploading... ${progress}%`}
            </p>
            <progress
              aria-label="Upload progress"
              max={100}
              value={progress}
              className="w-full accent-primary"
            />
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={primaryClass}
            disabled={busy || !categories.length}
          >
            {busy ? "Uploading..." : "Upload document"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
