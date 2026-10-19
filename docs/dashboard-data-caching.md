# Dashboard data caching

The home dashboard, analytics, finance invoice views, and user management directory use `useDashboardQuery` with a shared in-memory cache. Successful responses are fresh for 60 seconds. Keys include the signed-in user, role and view parameters (including activity page and invoice ID). User directory and role catalog responses have separate keys. Identical in-flight requests are shared.

Fresh data appears immediately on revisit. Stale data stays visible while a visible view revalidates on activation, browser focus, visibility change or its 60-second timer. Refresh errors retain successful data with retry feedback; authorization errors discard the protected response. Initial loading, empty and error states remain distinct. No business data is persisted to browser storage.

`DashboardWorkspace` lazily loads the four views on their first visit. React Activity preserves their DOM and local state when navigating away and pauses hidden effects, including timers and request subscriptions. Returning to a visited view resumes effects and checks freshness. The workspace resets when the user or role changes.

User create, edit, activation, and deactivation responses update the cached directory immediately. Successful payment recording and invoice PDF generation invalidate the cached views and invoice details. Visible queries reload immediately; hidden queries reload when shown. In-flight responses from before invalidation or logout cannot overwrite newer data. Logout and changes to user identity or role clear the cache. Inactive entries are bounded to prevent unbounded activity-page or invoice-detail accumulation.

API requests continue to use the shared Axios client. No backend endpoint changes are required.

Run the cache and view lifecycle tests with `npm run test:dashboard-cache`.
