# Invoice creation

Finance provides a **Create Invoice** action for `ADMIN`, `MANAGEMENT`, `FINANCE`, and `ACCOUNTANT`. Authorized users who can access Project Details also have a shortcut with the selected project locked in the form.

The form loads existing records from `GET /invoices/creation-options` through the shared authenticated Axios client. Deploy both the API gateway and invoice service changes with the frontend. This endpoint exposes project IDs/names, quotation-linked customer IDs, and customer IDs/names under the same gateway permissions as invoice creation; it does not extend project management permissions.

For projects with an existing customer association, only that customer is available. Standalone projects permit any existing customer. Projects associated with conflicting customers cannot be invoiced until the records are corrected. The backend revalidates the relationship on every creation request.

The form submits `POST /invoices` with `projectId`, `customerId`, `invoiceDate`, `totalAmount`, and `status` (`DRAFT` or `ISSUED`). Optional `dueDate` and trimmed `notes` are omitted when empty. Dates must be real calendar dates; the due date cannot precede the invoice date. Amounts must be positive with at most two decimal places and fit the database limit of LKR 9,999,999,999.99. Notes are limited to 2000 characters.

While submitting, the form blocks repeat submissions and closing. Automatic network retries are disabled for invoice creation. A server rejection preserves the entered values and displays the backend error. Success closes the form, shows confirmation, and invalidates the shared dashboard cache so active invoice and summary queries refresh and other cached views revalidate when opened. Existing PDF generation and payment recording remain available.

Run `npm run test:dashboard-cache` for frontend regression coverage. Backend invoice repository/controller and finance authorization tests cover the lookup endpoint and its permissions.
