# Agent Guidelines & Rules

## API & HTTP Request Rules

1. **Mandatory Use of Shared Axios Client**:
   - Always check and use the centralized Axios client from [`src/lib/axios.ts`](./src/lib/axios.ts) (`apiClient`) for all API requests throughout the application.
   - Do not instantiate new `axios.create()` instances or use raw `axios` / `fetch` for backend API interactions.

2. **Do Not Modify the Axios Client**:
   - Under no circumstances should you edit or modify [`src/lib/axios.ts`](./src/lib/axios.ts) unless explicitly instructed and approved by the user.
   - All token interceptors, automatic refresh workflows, retry policies, and standardized `ApiError` handling inside [`src/lib/axios.ts`](./src/lib/axios.ts) must remain intact.
