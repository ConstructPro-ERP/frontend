"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useDashboardQuery } from "@/hooks/useDashboardQuery";
import {
  createFinanceInvoice,
  getInvoiceCreationOptions,
  getFinanceErrorMessage,
} from "@/services/financeApi";
import type {
  FinanceInvoiceDetails,
  FinanceInvoiceFormErrors,
  FinanceInvoiceFormValues,
} from "@/types/finance";
import {
  canCreateFinanceInvoice,
  createFinanceInvoiceFormValues,
  validateFinanceInvoiceForm,
} from "./financeUtils";
import {
  Modal,
  Notice,
  buttonClass,
  inputClass,
  primaryClass,
} from "../projects/ProjectUI";

type Props = {
  projectId?: string;
  onClose: () => void;
  onCreated: (invoice: FinanceInvoiceDetails) => void;
};

export default function CreateInvoiceForm(props: Props) {
  const user = useSelector((state: RootState) => state.auth.user);
  if (!canCreateFinanceInvoice(user?.role))
    return <Notice error>You do not have access to create invoices.</Notice>;
  return (
    <InvoiceForm
      key={`${user?.id}:${user?.role}:${props.projectId ?? ""}`}
      {...props}
    />
  );
}

function InvoiceForm({ projectId, onClose, onCreated }: Props) {
  const options = useDashboardQuery(
    "finance:creation-options",
    getInvoiceCreationOptions,
  );
  const [values, setValues] = useState(() =>
    createFinanceInvoiceFormValues(projectId),
  );
  const [errors, setErrors] = useState<FinanceInvoiceFormErrors>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const id = useId();
  const project = options.data?.projects.find(
    (item) => item.id === values.projectId,
  );
  const customers =
    options.data?.customers.filter(
      (item) =>
        project &&
        (project.customerIds.length === 0 ||
          (project.customerIds.length === 1 &&
            project.customerIds[0] === item.id)),
    ) ?? [];

  function change(field: keyof FinanceInvoiceFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(field === "projectId" ? { customerId: "" } : {}),
    }));
    setErrors({});
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving.current || !options.data || options.error) return;
    const validation = validateFinanceInvoiceForm(values);
    if (!project) validation.projectId = "Select an existing project.";
    if (!customers.some((item) => item.id === values.customerId))
      validation.customerId = "Select a customer for this project.";
    setErrors(validation);
    if (Object.keys(validation).length) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const invoice = await createFinanceInvoice(values);
      onCreated(invoice);
    } catch (failure) {
      setError(
        getFinanceErrorMessage(
          failure,
          "Invoice could not be created. Please try again.",
        ),
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  const fieldProps = (field: keyof FinanceInvoiceFormValues) => ({
    id: `${id}-${field}`,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `${id}-${field}-error` : undefined,
    className: inputClass,
  });
  const fieldError = (field: keyof FinanceInvoiceFormValues) =>
    errors[field] ? (
      <p id={`${id}-${field}-error`} className="mt-1 text-xs text-error">
        {errors[field]}
      </p>
    ) : null;

  return (
    <Modal title="Create Invoice" onClose={onClose} busy={busy}>
      <form onSubmit={submit} noValidate className="space-y-4 p-5">
        <p className="text-sm text-on-surface-muted">
          Create a draft or issue an invoice for an existing construction
          project.
        </p>
        {options.loading && (
          <p role="status">Loading projects and customers…</p>
        )}
        {options.error ? (
          <Notice error>
            {getFinanceErrorMessage(
              options.error,
              "Projects and customers could not be loaded.",
            )}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => void options.refresh()}
            >
              Try again
            </button>
          </Notice>
        ) : null}
        {options.data?.projects.length === 0 && (
          <Notice>
            No projects available. Create a project before creating an invoice.
          </Notice>
        )}
        {error && <Notice error>{error}</Notice>}
        <fieldset
          disabled={busy || !options.data || !!options.error}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label
              htmlFor={`${id}-projectId`}
              className="mb-1.5 block text-xs font-semibold"
            >
              Project *
            </label>
            <select
              {...fieldProps("projectId")}
              value={values.projectId}
              disabled={!!projectId}
              onChange={(e) => change("projectId", e.target.value)}
            >
              <option value="">Select project</option>
              {options.data?.projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.projectName}
                </option>
              ))}
            </select>
            {fieldError("projectId")}
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor={`${id}-customerId`}
              className="mb-1.5 block text-xs font-semibold"
            >
              Customer *
            </label>
            <select
              {...fieldProps("customerId")}
              value={values.customerId}
              disabled={!project}
              onChange={(e) => change("customerId", e.target.value)}
            >
              <option value="">Select customer</option>
              {customers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName}
                </option>
              ))}
            </select>
            {fieldError("customerId")}
            {project && customers.length === 0 && (
              <p className="mt-1 text-xs text-error">
                No eligible customer is available for this project. Check its
                customer and quotation records.
              </p>
            )}
          </div>
          {(
            [
              ["invoiceDate", "Invoice date *"],
              ["dueDate", "Due date (optional)"],
            ] as const
          ).map(([field, title]) => (
            <div key={field}>
              <label
                htmlFor={`${id}-${field}`}
                className="mb-1.5 block text-xs font-semibold"
              >
                {title}
              </label>
              <input
                {...fieldProps(field)}
                type="date"
                value={values[field]}
                min={field === "dueDate" ? values.invoiceDate : undefined}
                onChange={(e) => change(field, e.target.value)}
              />
              {fieldError(field)}
            </div>
          ))}
          <div>
            <label
              htmlFor={`${id}-totalAmount`}
              className="mb-1.5 block text-xs font-semibold"
            >
              Total amount (LKR) *
            </label>
            <input
              {...fieldProps("totalAmount")}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={values.totalAmount}
              onChange={(e) => change("totalAmount", e.target.value)}
            />
            {fieldError("totalAmount")}
          </div>
          <div>
            <label
              htmlFor={`${id}-status`}
              className="mb-1.5 block text-xs font-semibold"
            >
              Status *
            </label>
            <select
              {...fieldProps("status")}
              value={values.status}
              onChange={(e) => change("status", e.target.value)}
            >
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
            </select>
            {fieldError("status")}
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor={`${id}-notes`}
              className="mb-1.5 block text-xs font-semibold"
            >
              Notes (optional)
            </label>
            <textarea
              {...fieldProps("notes")}
              rows={3}
              maxLength={2000}
              value={values.notes}
              onChange={(e) => change("notes", e.target.value)}
            />
            <p className="mt-1 text-xs text-on-surface-muted">
              {values.notes.length}/2000 characters
            </p>
            {fieldError("notes")}
          </div>
        </fieldset>
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
            disabled={
              busy ||
              !options.data ||
              !!options.error ||
              !project ||
              customers.length === 0
            }
          >
            {busy ? "Creating invoice…" : "Create Invoice"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
