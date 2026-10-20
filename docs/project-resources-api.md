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
- Backend API requests use `lib/axios.ts`'s shared `apiClient`, preserving authentication, token refresh, retries, and normalized error handling.
  Direct Cloudinary uploads use a separate HTTP client without application authentication credentials.
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

Project documents are managed through the Document Service and API Gateway.

| Method | Route                                                  | Purpose                                              |
| ------ | ------------------------------------------------------ | ---------------------------------------------------- |
| GET    | `/projects/:projectId/documents`                       | List project documents with filtering and pagination |
| GET    | `/document-categories`                                 | List document categories                             |
| POST   | `/projects/:projectId/documents`                       | Legacy multipart upload                              |
| POST   | `/projects/:projectId/documents/upload-authorizations` | Generate signed Cloudinary upload authorization      |
| POST   | `/projects/:projectId/documents/:documentId/complete`  | Verify and activate a direct upload                  |
| PATCH  | `/documents/:id`                                       | Update document metadata                             |
| GET    | `/documents/:id/download`                              | Generate a temporary authenticated download URL      |
| DELETE | `/documents/:id`                                       | Delete a project document                            |

### Document Metadata

Document responses include:

- `id`, `projectId`, `categoryId`
- `originalName`, `fileName`, `mimeType`, `fileSize`
- `description`, `createdAt`, `updatedAt`
- `uploadedById`, `uploadedBy: { id, fullName } | null`
- `category: { id, categoryName }`

Document lists support server-side search, category filtering, sorting, and pagination.

Metadata editing supports `fileName`, `categoryId`, and `description` without modifying the stored file or original uploader.

### Hybrid Upload Strategy

The frontend selects the upload method based on file size:

- **Up to 3 MiB:** Legacy multipart upload through the API Gateway.
- **Above 3 MiB:** Signed direct-to-Cloudinary upload.
- **Maximum file size:** 10 MiB by default for Cloudinary Free accounts.
  Setting `NEXT_PUBLIC_CLOUDINARY_PREMIUM=true` enables frontend uploads up
  to 50 MiB for Cloudinary accounts that support that asset size.

The legacy backend endpoint retains its 4 MiB limit. The frontend uses a 3 MiB threshold to provide request-size headroom.

Direct uploads follow three operations:

1. Request backend-signed upload authorization.
2. Transfer the file directly to Cloudinary.
3. Request backend verification and document activation.

Only metadata requests pass through the API Gateway during direct uploads. Cloudinary API secrets remain on the backend.

The Cloudinary transport uses a separate HTTP client without application authentication tokens.

Legacy multipart uploads disable automatic network and server-error retries to avoid duplicate uploads after uncertain outcomes.

Direct uploads support 6 MiB chunking, transfer progress, and controlled retry handling.

Upload success is displayed only after the backend confirms document activation.

### Supported File Formats

Supported formats include PDF, Office documents, CAD, Revit, BIM, Lumion, 3ds Max, 3D models, images, and approved archives.

The backend validates file size, filename, MIME type, permissions, and storage metadata.

PDF, PNG, JPEG, and DOCX retain binary-content verification. Other approved formats follow the documented opaque-attachment policy.

Frontend validation is for usability; backend validation remains authoritative.

### Secure Downloads

`GET /documents/:id/download` returns:

```json
{
  "downloadUrl": "https://example.com/signed-document",
  "expiresInSeconds": 300
}
```

The frontend validates the returned URL and displays it through the existing download modal.

Every download request requires backend authorization. Documents are not exposed through permanent public URLs.

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
