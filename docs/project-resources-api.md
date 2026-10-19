# Project resources: frontend architecture and required APIs

## Delivery scope

This document describes the Project Details frontend resource integrations
and their expected backend API contracts.

The Expenses interface integrates with the existing Project Service through
the API Gateway. Expense creation, listing, updates, deletion, summaries,
validation, and authorization are implemented in the backend.

DDP-88 aligns the expense frontend with those implemented endpoints.
Creator display depends on the backend enhancement tracked in
ConstructPro-ERP/backend#134.

No new frontend architecture, shared HTTP client, database migrations,
or API endpoints are required for this integration.

## Frontend architecture

- `ProjectDetails.tsx` owns project identity, section selection, and permissions.
  It passes project-scoped IDs and access flags into each resource section.
- `types/{milestone,task,expense,document}.ts` define API records and inputs.
- `services/*Api.ts` handle HTTP only, using `lib/axios.ts`'s shared `apiClient`.
  Authentication, token refresh, retries, and normalized errors remain centralized.
- `projectResources.ts` normalizes paginated lists and loads all pages for name
  selectors. A selector never silently uses only the current table page.
- `useProjectData.ts` owns request loading/error state and ignores stale results
  when dependencies change or a component unmounts.
- `ResourceSection.tsx` supplies shared list/filter/pagination/CRUD behavior for
  milestones, tasks, and expenses. Filters apply explicitly and reset pagination.
  Successful mutations reload records; failures leave forms open with their input.
- `ProjectUI.tsx` provides themed controls, native modal focus management,
  accessible labels, feedback, and guarded form submission.
- `projectResourceRules.ts` contains pure validation for calendar dates, milestone
  weight/progress, task names/status, expenses, and date filter ranges.
- Documents use a dedicated section and `DocumentUploadModal.tsx` because binary
  upload progress and download authorization differ from ordinary JSON CRUD.
  `projectDocumentRules.ts` owns file validation, display sizing, and URL checks.

Redux continues to own authentication only. Resource state is local to the feature;
no parallel HTTP client, global resource store, or new UI library was introduced.

## Permissions to enforce on the server

| Operation                                                     | Admin | Assigned Project Manager | Accountant |
| ------------------------------------------------------------- | ----- | ------------------------ | ---------- |
| Read resource lists, names, categories and document downloads | Yes   | Assigned projects only   | Yes        |
| Create/edit/delete milestones and tasks; assign tasks         | Yes   | Assigned projects only   | No         |
| Create/edit expenses                                          | Yes   | No                       | Yes        |
| Delete expenses                                               | Yes   | No                       | No         |
| Upload/edit/delete documents                                  | Yes   | Assigned projects only   | No         |

All mutation controls are hidden on `COMPLETED` and `CANCELLED` projects. Backend
authorization must enforce the same rules, including project membership for child
record routes and consistency between a task's milestone and project. Client
permissions are presentation logic, not security enforcement. Uploader/recorder
identity comes from the authenticated actor, never a submitted user ID.

## Common response and error format

All JSON requests/responses use the existing gateway envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "data": [],
    "meta": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
  }
}
```

The list adapter also supports the gateway's flattened form (`data: []` with
top-level `meta`), and complete unpaginated arrays. Paginated endpoints must return
valid integer metadata. Use stable ordering with an ID tie-breaker. `page` starts
at 1 and `limit` is at most 100. Name selectors request all pages with `limit=100`.
Dates in forms are `YYYY-MM-DD`; accept these as calendar dates and return ISO
dates consistently. UUIDs remain values, while users see names.

Error responses should retain `statusCode`, `code`, `message`, and optional
`details` using the existing gateway error format. Use 400 for invalid input, 403
for denied access, 404 for missing records, and 409 for lifecycle/dependency
conflicts. Missing feature routes currently display an unavailable message.

## Milestones

| Method | Route                             | Input / result                              |
| ------ | --------------------------------- | ------------------------------------------- |
| GET    | `/projects/:projectId/milestones` | Unpaginated `Milestone[]`                   |
| POST   | `/projects/:projectId/milestones` | Milestone metadata; defaults to 0% Pending  |
| PATCH  | `/milestones/:id`                 | Metadata only; no status changes            |
| PATCH  | `/milestones/:id/progress`        | `{ progressPercentage, status? }`           |
| DELETE | `/milestones/:id`                 | Deletes milestones without associated tasks |

The frontend performs milestone search, status filtering, sorting,
and pagination locally using `milestoneList.ts`.

Milestone weights are integers from 1 to 10. Progress is a
percentage from 0 to 100.

When status is omitted from the progress request, the backend
derives Pending, In Progress, or Completed from the percentage.

Project weighted progress is recalculated by the backend and
refreshed in Project Details after successful mutations.

## Tasks

| Method | Route                                 | Input / result                                               |
| ------ | ------------------------------------- | ------------------------------------------------------------ |
| GET    | `/projects/:projectId/tasks`          | Paginated `Task` records                                     |
| GET    | `/projects/:projectId/task-assignees` | Paginated `{ id, fullName, email? }`                         |
| POST   | `/tasks`                              | `{ projectId, taskName, description, dueDate, milestoneId }` |
| PATCH  | `/tasks/:id`                          | Editable task fields, excluding project/assignee identity    |
| PATCH  | `/tasks/:id/status`                   | `{ status }`                                                 |
| PATCH  | `/tasks/:id/assign`                   | `{ assignedToId: UUID or null }`                             |
| DELETE | `/tasks/:id`                          | Deletes the task                                             |

Task statuses are `TODO`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`. Creation defaults
to `TODO`. Optional milestone and due date are submitted as `null` when cleared.
Names are 1–200 trimmed characters; descriptions at most 2,000. Lists accept
`search`, `status`, `milestoneId`, `assignedToId`, `sortBy` (`createdAt`, `dueDate`,
`taskName`), `sortOrder` (`asc`, `desc`), `page`, `limit`.

Return `assignedTo: { fullName } | null` and
`milestone: { id, milestoneName } | null` with task records. The project-scoped
assignee directory must be readable by all project readers and expose only eligible
team members, plus currently assigned members needed to display existing records.
The server must reject a new assignment to an ineligible/inactive member. This
endpoint avoids granting managers access to the admin-only global user directory.
Tasks load name selectors independently of filters and use their UUIDs in payloads.
Task completion does not update milestone progress automatically.

## Expenses

Project expenses are managed through the existing Project Service and
API Gateway.

| Method | Route                                   | Input / result                  |
| ------ | --------------------------------------- | ------------------------------- |
| GET    | `/projects/:projectId/expenses`         | Paginated expense records       |
| GET    | `/projects/:projectId/expenses/summary` | Project-wide totals by category |
| GET    | `/expenses/:id`                         | Expense details                 |
| POST   | `/projects/:projectId/expenses`         | Create an expense               |
| PATCH  | `/expenses/:id`                         | Update expense fields           |
| DELETE | `/expenses/:id`                         | Admin-only deletion             |

### Request Validation

Expense creation accepts:

- `amount`: Required positive decimal string with up to 10 integer digits
  and 2 fractional digits, matching Decimal(12,2).
- `expenseDate`: Required valid ISO date-time string.
- `category`: Optional string or `null`, maximum 100 characters.
- `description`: Optional string or `null`, maximum 1,000 characters.

Optional category and description values must not contain only whitespace.
The frontend normalizes empty values to `null`.

Expense dates must fall within the project's start and end dates when an
end date exists. The backend enforces this constraint independently.

The update endpoint accepts partial changes to these editable fields.

### List Response and Filtering

The expense list returns:

`{ data: Expense[], meta: { page, limit, total, totalPages } }`

Supported query parameters:

- `category`
- `fromDate` — inclusive start date
- `toDate` — inclusive end date
- `page` and `limit` — server-side pagination, with maximum limit 100
- `sortBy` — `expenseDate`, `createdAt`, or `amount`
- `sortOrder` — `asc` or `desc`

The frontend preserves the server-provided pagination metadata.

### Expense Creator

The backend derives `recordedById` from the authenticated user.
Clients must not submit or modify this value.

With the creator-details backend enhancement, expense responses include:

`recordedBy: { id: string, fullName: string }`

The existing `recordedById` is retained for compatibility.

The frontend displays `recordedBy.fullName` in the Recorded by column.
The original creator remains unchanged after expense updates.

### Expense Summary

The summary endpoint returns:

`{ total: string, byCategory: { category: string | null, amount: string }[] }`

Both total and category amounts are decimal strings.

Summary values cover the whole project independently of table pagination
and filtering.

After successful expense creation, updates, deletion, or explicit Refresh,
the frontend reloads the expense list and project-wide summary.

Remaining budget is calculated using the project's budget and the
backend-provided total expense amount.

### Authorization

- Admin: Create, read, update, and delete expenses.
- Accountant: Create, read, and update expenses; cannot delete.
- Project Manager: Read-only access to assigned projects.
- Unauthorized project access is rejected by the backend.
- Expenses cannot be modified in completed or cancelled projects.

Backend validation, authorization, and lifecycle errors are displayed
through the existing frontend error-handling components.

## Documents

| Method | Route                                      | Input / result                                            |
| ------ | ------------------------------------------ | --------------------------------------------------------- |
| GET    | `/projects/:projectId/documents`           | Paginated `ProjectDocument` records                       |
| GET    | `/projects/:projectId/document-categories` | Paginated `DocumentCategory` records                      |
| POST   | `/projects/:projectId/documents`           | Multipart `file` and `categoryId`; returns saved document |
| PATCH  | `/documents/:id`                           | `{ fileName, categoryId }`; returns saved document        |
| GET    | `/documents/:id/download`                  | `{ url: string }`, short-lived authorized download URL    |
| DELETE | `/documents/:id`                           | Deletes metadata and associated stored file               |

Document lists accept `search`, `categoryId`, `page`, `limit`; default to newest
first with stable ordering. Records include `id`, `projectId`, `categoryId`,
`fileName`, `mimeType`, `sizeBytes`, `createdAt`, `category: { id, categoryName }`,
and nullable `uploadedBy: { id, fullName }`. Categories include `id`,
`categoryName`, and optional `description`. Category administration is outside
this project's document section; empty categories disable upload with a clear message.

The proposed upload limit is 20 MiB. Allowed extensions: PDF, DOC, DOCX, XLS,
XLSX, CSV, TXT, PNG, JPG, JPEG, WEBP. Reject empty files. The server must independently
validate actual file contents, size, category membership, and access. File names
are 1–255 characters with no path separators/control characters. Client extension
checks alone cannot validate file contents.

Uploads include an `Idempotency-Key` UUID. The shared Axios client automatically
retries network/5xx failures, so the backend must deduplicate requests with the
same actor/key before storing a second file. Each new user submission has a new
key. Backend CORS must allow this header. Upload progress reaching 100% means bytes
have transferred; success is displayed only after the server responds.

Download requests must authorize each document before returning a short-lived
HTTP(S) URL. Production URLs should use HTTPS and serve downloads with an
appropriate Content-Disposition header. The frontend rejects executable/data URLs
and credential-bearing URLs, then presents an explicit download link with
`noopener noreferrer`. Do not return a permanently public storage URL as an access
control substitute. No raw HTML/SVG preview is rendered.

## Database gaps observed

The current Prisma schema has:

- Milestone: name, due date, status; missing description, weight, and progress.
- Task: name, status, milestone and assignee relations; missing description/due date.
- Expense: amount as `Float`, project/recorder relations, timestamps; missing
  category, description, and expense date. Decimal storage needs a reviewed migration.
- Document/category: basic file URL/name and relations; missing MIME type and byte
  size, storage lifecycle, authorized downloads, and idempotent upload handling.

Backend work must resolve these gaps before the frontend's workflows can persist.
Do not apply a migration from this frontend change.

## Verification

Use the existing Node test runner for validators, API payloads, pagination, upload
multipart handling, URL rejection, and server-rendered UI checks. Run ESLint and
TypeScript on the changed code. After backend implementation, manually exercise
all tabs as Admin, assigned/unassigned Manager, and Accountant; check terminal
project permissions, second-page selectors, failed-save input preservation,
duplicate upload retries, file downloads, and summary/progress refresh.
