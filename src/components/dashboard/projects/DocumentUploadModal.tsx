"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { DocumentCategory, DocumentUploadStage } from "@/types/document";
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
  const [stage, setStage] = useState<DocumentUploadStage>("validating");

  const submitting = useRef(false);
  const activeController = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      activeController.current?.abort();
    };
  }, []);

  function cancelUpload() {
    if (submitting.current) {
      activeController.current?.abort();
      return;
    }

    onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting.current) return;

    setStage("validating");

    const validation =
      validateDocumentFile(file) ??
      validateDocumentMetadata({
        fileName: file?.name ?? "",
        categoryId,
      });

    if (validation || !file) {
      setError(validation ?? "Choose a file.");
      return;
    }

    const controller = new AbortController();

    activeController.current = controller;
    submitting.current = true;

    setBusy(true);
    setError("");
    setProgress(0);

    try {
      await uploadDocument(projectId, file, categoryId, setProgress, {
        signal: controller.signal,
        onStage: setStage,
      });

      if (!controller.signal.aborted) {
        onSaved();
        onClose();
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(errorMessage(error));
      }
    } finally {
      if (activeController.current === controller) {
        activeController.current = null;
      }

      submitting.current = false;
      setBusy(false);

      if (controller.signal.aborted) {
        onClose();
      }
    }
  }

  const stageText: Record<DocumentUploadStage, string> = {
    validating: "Validating document...",
    authorizing: "Requesting upload authorization...",
    uploading:
      progress === 100
        ? "Transfer complete. Awaiting confirmation..."
        : `Uploading... ${progress}%`,
    retrying: "Network interruption. Retrying upload...",
    verifying: "Verifying and saving document...",
    completed: "Document uploaded successfully.",
  };

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
          <div role="status" aria-live="polite" className="space-y-2 text-sm">
            <p>{stageText[stage]}</p>
            <progress
              aria-label="Upload progress"
              max={100}
              value={progress}
              className="w-full accent-primary"
            />
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
          <button type="button" className={buttonClass} onClick={cancelUpload}>
            {busy ? "Cancel upload" : "Cancel"}
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
