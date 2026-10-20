"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { getLead, listLeads } from "@/components/dashboard/leads/leadApi";
import type { LeadOption } from "@/types/quotation";

interface LeadSelectDropdownProps {
  value: string;
  onChange: (leadId: string, leadSummary?: LeadOption) => void;
  error?: string;
  disabled?: boolean;
}

export default function LeadSelectDropdown({
  value,
  onChange,
  error,
  disabled = false,
}: LeadSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [manualMode, setManualMode] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [resolvedLead, setResolvedLead] = useState<LeadOption | null>(null);

  // Load leads using the shared API helper. Ignore outdated responses when the
  // search changes or the component unmounts.
  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const result = await listLeads({ search: searchTerm, limit: 100 });

        if (active) {
          setLeads(
            result.leads.map((lead) => ({
              ...lead,
              email: lead.email ?? undefined,
              phone: lead.phone ?? undefined,
            })),
          );
        }
      } catch (error) {
        if (active) {
          // Do not submit synthetic demo IDs during service outages.
          setLeads([]);
          setLoadError(
            error instanceof Error ? error.message : "Unable to load leads.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm, attempt]);

  useEffect(() => {
    let active = true;
    if (value)
      getLead(value)
        .then((lead) => {
          if (active) {
            setSelectionError("");
            setResolvedLead({
              ...lead,
              email: lead.email ?? undefined,
              phone: lead.phone ?? undefined,
            });
          }
        })
        .catch((error) => {
          if (active)
            setSelectionError(
              error instanceof Error
                ? error.message
                : "Selected lead could not be loaded.",
            );
        });
    return () => {
      active = false;
    };
  }, [value, attempt]);

  const selectedLead =
    leads.find((l) => l.id === value) ??
    (resolvedLead?.id === value ? resolvedLead : null);

  const filteredLeads = leads.filter(
    (l) =>
      l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.companyName &&
        l.companyName.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (manualMode) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-[11.5px] font-semibold text-on-surface-variant">
            Lead ID (Manual Entry)
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setManualMode(false)}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            Switch to Lead Picker
          </button>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Existing lead UUID"
          disabled={disabled}
          className={`w-full rounded-lg border px-3 py-2.25 text-[13px] text-on-background outline-none transition ${
            error
              ? "border-error bg-error-container"
              : "border-outline-variant bg-surface-container focus:border-primary"
          }`}
        />
        {error ? <p className="text-xs text-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="relative space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11.5px] font-semibold text-on-surface-variant">
          Select Lead
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setManualMode(true)}
          className="text-[11px] font-medium text-on-surface-muted hover:text-primary transition"
        >
          Enter ID manually
        </button>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[13px] transition ${
          error
            ? "border-error bg-error-container text-on-error-container"
            : "border-outline-variant bg-surface-container text-on-background hover:bg-surface-container-high focus:border-primary"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <div className="flex flex-col truncate pr-2">
          {selectedLead ? (
            <>
              <span className="font-semibold text-on-background">
                {selectedLead.customerName}
              </span>
              <span className="text-[11px] text-on-surface-muted">
                {selectedLead.id}
                {selectedLead.companyName
                  ? ` • ${selectedLead.companyName}`
                  : ""}
              </span>
            </>
          ) : value ? (
            <span className="text-on-background font-medium">{value}</span>
          ) : (
            <span className="text-on-surface-muted">
              Choose a lead for this quotation...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isLoading ? (
            <Loader2 size={14} className="animate-spin text-primary" />
          ) : (
            <ChevronDown
              size={15}
              className={`text-on-surface-muted transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </div>
      </button>

      {error ? <p className="text-xs text-error">{error}</p> : null}

      {loadError || selectionError ? (
        <p role="alert" className="text-xs text-error">
          {selectionError || loadError}{" "}
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            Retry
          </button>
        </p>
      ) : null}
      {/* Dropdown Menu */}
      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-3">
          {/* Search box inside dropdown */}
          <div className="border-b border-outline-variant p-2">
            <div className="flex items-center gap-2 rounded-lg bg-surface-container px-2.5 py-1.5">
              <Search size={13} className="text-on-surface-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search leads by name or ID..."
                className="w-full bg-transparent text-xs text-on-background outline-none placeholder:text-on-surface-muted"
                autoFocus
              />
            </div>
          </div>

          {/* Leads list */}
          <div className="max-h-48 overflow-y-auto p-1">
            {filteredLeads.length === 0 ? (
              <div className="p-3 text-center text-xs text-on-surface-muted">
                No matching leads found
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = lead.id === value;
                return (
                  <button
                    disabled={disabled || isLoading}
                    key={lead.id}
                    type="button"
                    onClick={() => {
                      onChange(lead.id, lead);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                      isSelected
                        ? "bg-primary-soft text-primary font-medium"
                        : "hover:bg-surface-container text-on-background"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">
                          {lead.customerName}
                        </span>
                        {lead.status ? (
                          <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-[10px] text-on-surface-muted">
                            {lead.status}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-[11px] text-on-surface-muted">
                        ID: {lead.id}
                        {lead.email ? ` • ${lead.email}` : ""}
                      </div>
                    </div>
                    {isSelected ? (
                      <Check size={14} className="text-primary" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
