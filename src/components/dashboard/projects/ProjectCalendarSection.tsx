"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import type { Project } from "@/types/project";
import { ApiError } from "@/lib/ApiError";
import {
  getCalendarConnectionStatus,
  listProjectCalendarEvents,
  createProjectCalendarEvent,
  updateProjectCalendarEvent,
  deleteProjectCalendarEvent,
  type CalendarEvent,
  type CalendarEventInput,
} from "@/services/calendarApi";
import {
  Editor,
  Notice,
  buttonClass,
  primaryClass,
  panelClass,
  errorMessage,
} from "./ProjectUI";

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function localTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return `${dayKey(date)}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
function occursOn(event: CalendarEvent, day: Date) {
  const start = event.start?.dateTime ?? event.start?.date;
  if (!start) return false;
  const end = event.end?.dateTime ?? event.end?.date ?? start;
  const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  // All-day dates are interpreted in the displayed calendar's local timezone.
  const parse = (value: string) =>
    new Date(value.length === 10 ? `${value}T00:00:00` : value).getTime();
  return parse(start) < next.getTime() && parse(end) > day.getTime();
}

export default function ProjectCalendarSection({
  project,
  canManage,
}: {
  project: Project;
  canManage: boolean;
}) {
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState(() => dayKey(new Date()));
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editor, setEditor] = useState<CalendarEvent | "new" | null>(null);
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      setEvents([]);
      try {
        const status = await getCalendarConnectionStatus();
        if (!active) return;
        setConnected(status.connected);
        if (status.connected) {
          const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
          const result = await listProjectCalendarEvents(
            project.id,
            month.toISOString(),
            next.toISOString(),
          );
          if (active) setEvents(result);
        }
      } catch (error) {
        if (!active) return;
        if (
          error instanceof ApiError &&
          ["CALENDAR_NOT_CONNECTED", "CALENDAR_REAUTH_REQUIRED"].includes(
            error.code,
          )
        ) {
          setConnected(false);
        } else {
          setError(errorMessage(error));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [project.id, month, revision]);

  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const selectedDate = new Date(`${selected}T00:00:00`);
  const selectedEvents = events.filter((event) =>
    occursOn(event, selectedDate),
  );
  function moveMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelected(dayKey(next));
  }
  function saved(message: string) {
    setFeedback(message);
    setRevision((value) => value + 1);
  }
  const editing = editor && editor !== "new" ? editor : null;
  return (
    <section className="space-y-4" aria-label="Project calendar">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <CalendarDays size={20} /> Project calendar
          </h2>
          <p className="mt-1 text-sm text-on-surface-muted">
            Project events in your connected Google Calendar. Times shown in{" "}
            {timeZone}.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={buttonClass}
            disabled={loading}
            onClick={() => setRevision((value) => value + 1)}
            aria-label="Refresh calendar"
          >
            <RefreshCw size={16} />
          </button>
          {connected && !loading && !error && canManage && (
            <button className={primaryClass} onClick={() => setEditor("new")}>
              <Plus size={16} /> Add event
            </button>
          )}
        </div>
      </div>
      {feedback && <Notice>{feedback}</Notice>}
      {error && <Notice error>{error}</Notice>}
      {loading ? (
        <p role="status" className="py-8 text-sm">
          Loading calendar...
        </p>
      ) : !connected && !error ? (
        <div className={panelClass + " p-6"}>
          <h3 className="font-semibold">Connect Google Calendar</h3>
          <p className="my-3 text-sm text-on-surface-muted">
            Connect your Google account in Integrations, then return to this
            project&apos;s Calendar tab.
          </p>
          <Link href="/settings/integrations" className={primaryClass}>
            Open integrations
          </Link>
        </div>
      ) : (
        !error && (
          <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
            <div className={panelClass + " overflow-hidden"}>
              <div className="flex items-center justify-between p-4">
                <button
                  className={buttonClass}
                  aria-label="Previous month"
                  onClick={() => moveMonth(-1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <h3 aria-live="polite" className="font-semibold">
                  {month.toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <button
                  className={buttonClass}
                  aria-label="Next month"
                  onClick={() => moveMonth(1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 border-t border-outline-variant">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (name) => (
                    <span
                      key={name}
                      className="p-2 text-center text-xs font-semibold text-on-surface-muted"
                    >
                      {name}
                    </span>
                  ),
                )}
                {Array.from({ length: month.getDay() }, (_, index) => (
                  <span key={`empty-${index}`} />
                ))}
                {Array.from({ length: days }, (_, index) => {
                  const day = new Date(
                    month.getFullYear(),
                    month.getMonth(),
                    index + 1,
                  );
                  const key = dayKey(day);
                  const count = events.filter((event) =>
                    occursOn(event, day),
                  ).length;
                  return (
                    <button
                      key={key}
                      aria-label={`${day.toLocaleDateString("en-GB", { dateStyle: "full" })}, ${count} events`}
                      aria-pressed={selected === key}
                      onClick={() => setSelected(key)}
                      className={`min-h-16 border-t border-outline-variant p-2 text-center text-sm transition hover:bg-primary-soft sm:min-h-20 ${selected === key ? "bg-primary-soft font-bold text-primary ring-2 ring-inset ring-primary" : ""}`}
                    >
                      <span
                        className={
                          key === dayKey(new Date())
                            ? "rounded-full bg-primary px-2 py-1 text-on-primary"
                            : ""
                        }
                      >
                        {index + 1}
                      </span>
                      {count > 0 && (
                        <span className="mt-2 block text-xs text-primary">
                          {count}{" "}
                          <span className="hidden sm:inline">
                            {count === 1 ? "event" : "events"}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <aside className={panelClass + " p-5"}>
              <h3 className="font-semibold">
                {selectedDate.toLocaleDateString("en-GB", {
                  dateStyle: "full",
                })}
              </h3>
              {selectedEvents.length === 0 && (
                <p className="py-8 text-sm text-on-surface-muted">
                  No project events for this day.
                </p>
              )}
              <div className="mt-4 space-y-4">
                {selectedEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-lg border border-outline-variant p-4"
                  >
                    <h4 className="break-words font-semibold">
                      {event.summary || "Untitled event"}
                    </h4>
                    <p className="mt-1 text-xs text-primary">
                      {event.start?.dateTime
                        ? `${new Date(event.start.dateTime).toLocaleString("en-GB")} - ${event.end?.dateTime ? new Date(event.end.dateTime).toLocaleString("en-GB") : ""}`
                        : "All day"}
                    </p>
                    {event.location && (
                      <p className="mt-2 break-words text-sm text-on-surface-muted">
                        {event.location}
                      </p>
                    )}
                    {event.description && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-on-surface-muted">
                        {event.description}
                      </p>
                    )}
                    {canManage && (
                      <div className="mt-3 flex gap-2">
                        <button
                          className={buttonClass}
                          disabled={
                            !event.start?.dateTime || !event.end?.dateTime
                          }
                          onClick={() => setEditor(event)}
                        >
                          Edit
                        </button>
                        <button
                          className={buttonClass + " text-error"}
                          onClick={() => setDeleting(event)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </aside>
          </div>
        )
      )}
      {editor && canManage && (
        <Editor
          title={editing ? "Edit calendar event" : "Add project event"}
          fields={[
            {
              name: "summary",
              label: "Event title",
              required: true,
              maxLength: 200,
            },
            { name: "location", label: "Location", maxLength: 500 },
            {
              name: "start",
              label: "Starts",
              type: "datetime-local",
              required: true,
            },
            {
              name: "end",
              label: "Ends",
              type: "datetime-local",
              required: true,
            },
            {
              name: "description",
              label: "Description",
              type: "textarea",
              maxLength: 2000,
            },
          ]}
          initial={{
            summary:
              editing?.summary ?? `${project.projectName} - Site meeting`,
            location: editing?.location ?? project.location ?? "",
            start: localTime(editing?.start?.dateTime) || `${selected}T09:00`,
            end: localTime(editing?.end?.dateTime) || `${selected}T10:00`,
            description: editing?.description ?? "",
          }}
          description={`Times are in ${timeZone}. This event is saved to your Google Calendar and linked to ${project.projectName}.`}
          validate={(values) =>
            !values.summary.trim()
              ? "Enter an event title."
              : !Number.isFinite(Date.parse(values.start)) ||
                  !Number.isFinite(Date.parse(values.end)) ||
                  new Date(values.end) <= new Date(values.start)
                ? "End time must be later than start time."
                : null
          }
          onClose={() => setEditor(null)}
          onSave={async (values) => {
            const input: CalendarEventInput = {
              summary: values.summary.trim(),
              description: values.description.trim(),
              location: values.location.trim(),
              startDateTime: new Date(values.start).toISOString(),
              endDateTime: new Date(values.end).toISOString(),
              timeZone,
            };
            if (editing)
              await updateProjectCalendarEvent(project.id, editing.id, input);
            else await createProjectCalendarEvent(project.id, input);
            saved(
              editing ? "Event updated." : "Event added to Google Calendar.",
            );
          }}
        />
      )}
      {deleting && canManage && (
        <Editor
          title="Delete calendar event?"
          description={`Delete “${deleting.summary || "Untitled event"}” from your Google Calendar? This cannot be undone.`}
          fields={[]}
          submitLabel="Delete event"
          onClose={() => setDeleting(null)}
          onSave={async () => {
            await deleteProjectCalendarEvent(project.id, deleting.id);
            saved("Event deleted.");
          }}
        />
      )}
    </section>
  );
}
