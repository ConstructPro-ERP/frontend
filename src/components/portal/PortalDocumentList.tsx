"use client";

import { useCallback, useRef, useState } from "react";
import { Download } from "lucide-react";
import { usePortalQuery } from "@/hooks/usePortalQuery";
import {
  getPortalDocumentDownloadUrl,
  listPortalDocuments,
} from "@/services/portalApi";
import { formatFileSize } from "@/lib/projectDocumentRules";
import { describePortalError, portalDate } from "@/lib/portalFormat";
import type { PortalDocument } from "@/types/portal";
import {
  PortalPager,
  PortalQueryBoundary,
  portalButtonClass,
} from "./PortalUI";

function startDownload(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener noreferrer";
  document.body.append(link);
  link.click();
  link.remove();
}

/** Documents shared with the client for one project, with signed downloads. */
export default function PortalDocumentList({
  projectId,
}: Readonly<{ projectId: string }>) {
  const [page, setPage] = useState(1);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const downloading = useRef(false);
  const load = useCallback(
    () => listPortalDocuments(projectId, page),
    [projectId, page],
  );
  const query = usePortalQuery(`documents:${projectId}:${page}`, load);

  async function download(item: PortalDocument) {
    if (downloading.current) return;
    downloading.current = true;
    setDownloadId(item.id);
    setDownloadError("");
    try {
      startDownload(
        await getPortalDocumentDownloadUrl(item.id),
        item.originalName,
      );
    } catch (error) {
      const { message } = describePortalError(error);
      setDownloadError(
        `${item.originalName} could not be downloaded. ${message}`,
      );
    } finally {
      downloading.current = false;
      setDownloadId(null);
    }
  }

  return (
    <>
      {downloadError ? (
        <div
          role="alert"
          className="border-b border-error/20 bg-error-container px-4 py-2 text-sm text-on-error-container"
        >
          {downloadError}
        </div>
      ) : null}
      <PortalQueryBoundary
        query={query}
        loadingLabel="Loading documents"
        isEmpty={(data) => data.items.length === 0}
        emptyTitle="No documents shared yet"
        emptyDescription="Documents your project team shares with you will appear here."
      >
        {(data) => (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-176 text-left text-sm">
                <caption className="sr-only">Shared project documents</caption>
                <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Document
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Size
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Shared
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {data.items.map((item) => (
                    <tr key={item.id}>
                      <th scope="row" className="px-4 py-3 font-medium">
                        {item.originalName}
                        {item.description ? (
                          <span className="block text-xs font-normal text-on-surface-muted">
                            {item.description}
                          </span>
                        ) : null}
                      </th>
                      <td className="px-4 py-3">
                        {item.category?.categoryName ?? "Uncategorized"}
                      </td>
                      <td className="px-4 py-3">
                        {formatFileSize(item.fileSize)}
                      </td>
                      <td className="px-4 py-3">
                        {portalDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className={portalButtonClass}
                          disabled={downloadId !== null}
                          aria-label={`Download ${item.originalName}`}
                          onClick={() => void download(item)}
                        >
                          <Download size={15} />
                          {downloadId === item.id ? "Preparing…" : "Download"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PortalPager
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              fetching={query.fetching}
              onChange={setPage}
            />
          </>
        )}
      </PortalQueryBoundary>
    </>
  );
}
