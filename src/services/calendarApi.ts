import apiClient from "@/lib/axios";

export type CalendarConnectionStatus = {
  connected: boolean;
  calendarId: string | null;
  connectedAt: string | null;
};

type CalendarConnectResponse = {
  authorizationUrl: string;
};

export async function getCalendarConnectionStatus() {
  const response =
    await apiClient.get<CalendarConnectionStatus>("/calendar/status");
  return response.data;
}

export async function beginCalendarConnection() {
  const response =
    await apiClient.post<CalendarConnectResponse>("/calendar/connect");
  return response.data.authorizationUrl;
}

export async function disconnectCalendar() {
  const response = await apiClient.del<{ connected: false }>(
    "/calendar/connection",
  );
  return response.data;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  extendedProperties?: { private?: { constructProProjectId?: string } };
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}
export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
}
export async function listProjectCalendarEvents(
  projectId: string,
  timeMin: string,
  timeMax: string,
) {
  const response = await apiClient.get<CalendarEvent[]>("/calendar/events", {
    params: { projectId, timeMin, timeMax, maxResults: 100 },
  });
  return response.data.filter(
    (event) =>
      event.extendedProperties?.private?.constructProProjectId === projectId,
  );
}
export async function createProjectCalendarEvent(
  projectId: string,
  input: CalendarEventInput,
) {
  const eventId = crypto.randomUUID().replaceAll("-", "");
  const response = await apiClient.post<CalendarEvent>("/calendar/events", {
    ...input,
    projectId,
    eventId,
  });
  return response.data;
}
export async function updateProjectCalendarEvent(
  projectId: string,
  eventId: string,
  input: CalendarEventInput,
) {
  const response = await apiClient.patch<CalendarEvent>(
    `/calendar/events/${encodeURIComponent(eventId)}`,
    input,
    { params: { projectId } },
  );
  return response.data;
}
export async function deleteProjectCalendarEvent(
  projectId: string,
  eventId: string,
) {
  await apiClient.del(`/calendar/events/${encodeURIComponent(eventId)}`, {
    params: { projectId },
  });
}
