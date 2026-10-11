"use client";
import { FileText } from "lucide-react";
import { panelClass } from "./ProjectUI";
export default function DocumentsSection() {
  return (
    <section className={panelClass + " p-8 text-center"}>
      <FileText size={32} className="mx-auto text-primary" />
      <h2 className="mt-4 text-lg font-bold">Project documents</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-on-surface-muted">
        Document uploads, categories, and downloads will be available when
        project document management is enabled.
      </p>
      <span className="mt-4 inline-block rounded-full bg-surface-container px-3 py-1 text-xs font-semibold">
        Coming soon
      </span>
    </section>
  );
}
