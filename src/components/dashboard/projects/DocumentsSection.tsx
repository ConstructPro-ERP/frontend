"use client";

import { useCallback, useRef, useState } from "react";
import { Download, FileText, RefreshCw, Upload } from "lucide-react";
import type { ProjectDocument } from "@/types/document";
import {
  deleteDocument,
  getDocumentDownloadUrl,
  listDocumentCategories,
  listDocuments,
  updateDocument,
} from "@/services/documentsApi";
import {
  formatFileSize,
  validateDocumentMetadata,
} from "@/lib/projectDocumentRules";
import { useProjectData } from "./useProjectData";
import DocumentUploadModal from "./DocumentUploadModal";
import {
  Editor,
  Empty,
  Modal,
  Notice,
  Pager,
  buttonClass,
  primaryClass,
  inputClass,
  panelClass,
  date,
  errorMessage,
} from "./ProjectUI";

export default function DocumentsSection({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [filters, setFilters] = useState({ search: "", categoryId: "" });
  const [uploading, setUploading] = useState(false);
  const [edit, setEdit] = useState<ProjectDocument | null>(null);
  const [deleting, setDeleting] = useState<ProjectDocument | null>(null);
  const [feedback, setFeedback] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [download, setDownload] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const downloading = useRef(false);
  const load = useCallback(
    () =>
      listDocuments(projectId, {
        page,
        limit: 10,
        search: filters.search || undefined,
        categoryId: filters.categoryId || undefined,
      }),
    [projectId, page, filters],
  );
  const loadCategories = useCallback(
    () => listDocumentCategories(projectId),
    [projectId],
  );
  const documents = useProjectData(load, revision);
  const categories = useProjectData(loadCategories, revision);
  const refresh = () => setRevision((value) => value + 1);

  async function prepareDownload(document: ProjectDocument) {
    if (downloading.current) return;
    downloading.current = true;
    setDownloadId(document.id);
    setDownloadError("");
    try {
      const url = await getDocumentDownloadUrl(document.id);
      setDownload({ name: document.fileName, url });
    } catch (error) {
      setDownloadError(errorMessage(error));
    } finally {
      downloading.current = false;
      setDownloadId(null);
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Documents</h2>
          <p className="mt-1 text-sm text-on-surface-muted">
            Keep project files organized by category and download the records
            you need.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={buttonClass}
            aria-label="Refresh documents"
            disabled={documents.loading || categories.loading}
            onClick={refresh}
          >
            <RefreshCw size={16} />
          </button>
          {canManage && (
            <button
              className={primaryClass}
              disabled={
                documents.loading ||
                !!documents.error ||
                categories.loading ||
                !!categories.error ||
                !categories.data?.length
              }
              onClick={() => setUploading(true)}
            >
              <Upload size={16} />
              Upload document
            </button>
          )}
        </div>
      </header>
      {feedback && <Notice>{feedback}</Notice>}
      {downloadError && <Notice error>{downloadError}</Notice>}
      {categories.error && (
        <Notice error>
          Document categories could not be loaded. {categories.error}{" "}
          <button className={buttonClass + " ml-2"} onClick={refresh}>
            Try again
          </button>
        </Notice>
      )}
      {!categories.loading &&
        !categories.error &&
        !categories.data?.length &&
        canManage && (
          <Notice>
            No document categories are available. An administrator must
            configure categories before files can be uploaded.
          </Notice>
        )}
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters({ search: search.trim(), categoryId });
          setPage(1);
        }}
      >
        <label className="min-w-48 flex-1 text-xs font-semibold">
          Search documents
          <input
            type="search"
            className={inputClass + " mt-2"}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="min-w-48 flex-1 text-xs font-semibold">
          Category
          <select
            className={inputClass + " mt-2"}
            value={categoryId}
            disabled={categories.loading || !!categories.error}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.categoryName}
              </option>
            ))}
          </select>
        </label>
        <button className={buttonClass}>Apply filters</button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            setSearch("");
            setCategoryId("");
            setFilters({ search: "", categoryId: "" });
            setPage(1);
          }}
        >
          Clear
        </button>
      </form>
      <div className={panelClass + " overflow-hidden"}>
        {documents.loading ? (
          <p role="status" className="p-8">
            Loading documents...
          </p>
        ) : documents.error ? (
          <div className="space-y-3 p-5">
            <Notice error>{documents.error}</Notice>
            <button className={buttonClass} onClick={refresh}>
              Try again
            </button>
          </div>
        ) : !documents.data?.data.length ? (
          <Empty
            title="No documents found"
            description={
              canManage
                ? "Upload a project file or adjust your filters."
                : "There are no documents for the selected filters."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Project documents</caption>
              <thead className="bg-surface-container text-xs text-on-surface-muted">
                <tr>
                  {[
                    "Document",
                    "Category",
                    "Uploaded by",
                    "Uploaded",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} scope="col" className="px-4 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.data.data.map((document) => (
                  <tr
                    key={document.id}
                    className="border-t border-outline-variant"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <FileText size={18} className="shrink-0 text-primary" />
                        <div>
                          <p className="max-w-xs break-words font-semibold">
                            {document.fileName}
                          </p>
                          <p className="mt-1 text-xs text-on-surface-muted">
                            {formatFileSize(document.sizeBytes)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {document.category?.categoryName ?? "Not available"}
                    </td>
                    <td className="px-4 py-4">
                      {document.uploadedBy?.fullName ?? "Not available"}
                    </td>
                    <td className="px-4 py-4">{date(document.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={buttonClass}
                          disabled={downloadId !== null}
                          aria-label={"Download " + document.fileName}
                          onClick={() => void prepareDownload(document)}
                        >
                          <Download size={15} />
                          {downloadId === document.id
                            ? "Preparing..."
                            : "Download"}
                        </button>
                        {canManage && (
                          <>
                            <button
                              className={buttonClass}
                              disabled={
                                categories.loading ||
                                !!categories.error ||
                                !categories.data?.length
                              }
                              onClick={() => setEdit(document)}
                            >
                              Edit
                            </button>
                            <button
                              className={buttonClass + " text-error"}
                              onClick={() => setDeleting(document)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {documents.data && !documents.loading && !documents.error && (
          <Pager
            page={page}
            total={documents.data.meta.total}
            totalPages={documents.data.meta.totalPages}
            onChange={setPage}
          />
        )}
      </div>
      {uploading && canManage && (
        <DocumentUploadModal
          projectId={projectId}
          categories={categories.data ?? []}
          onClose={() => setUploading(false)}
          onSaved={() => {
            setFeedback("Document uploaded successfully.");
            setPage(1);
            refresh();
          }}
        />
      )}
      {edit && canManage && (
        <Editor
          title="Edit document details"
          fields={[
            {
              name: "fileName",
              label: "File name",
              required: true,
              maxLength: 255,
            },
            {
              name: "categoryId",
              label: "Category",
              type: "select",
              required: true,
              options: [
                { value: "", label: "Select a category" },
                ...(categories.data ?? []).map((category) => ({
                  value: category.id,
                  label: category.categoryName,
                })),
              ],
            },
          ]}
          initial={{ fileName: edit.fileName, categoryId: edit.categoryId }}
          validate={(values) =>
            validateDocumentMetadata({
              fileName: values.fileName ?? "",
              categoryId: values.categoryId ?? "",
            })
          }
          onClose={() => setEdit(null)}
          onSave={async (values) => {
            await updateDocument(edit.id, {
              fileName: values.fileName.trim(),
              categoryId: values.categoryId,
            });
            setFeedback("Document details updated.");
            refresh();
          }}
        />
      )}
      {deleting && canManage && (
        <Editor
          title="Delete document?"
          description={
            "Permanently delete “" +
            deleting.fileName +
            "”? This cannot be undone."
          }
          fields={[]}
          submitLabel="Delete permanently"
          onClose={() => setDeleting(null)}
          onSave={async () => {
            await deleteDocument(deleting.id);
            if (documents.data?.data.length === 1 && page > 1)
              setPage(page - 1);
            setFeedback("Document deleted.");
            refresh();
          }}
        />
      )}
      {download && (
        <Modal title="Download document" onClose={() => setDownload(null)}>
          <div className="space-y-4 p-5">
            <p className="break-words">{download.name}</p>
            <p className="text-sm text-on-surface-muted">
              Your download link is ready. If it expires, close this dialog and
              request a new link.
            </p>
            <a
              href={download.url}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryClass}
            >
              Download file
            </a>
          </div>
        </Modal>
      )}
    </section>
  );
}
