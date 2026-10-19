"use client";

import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useDashboardQuery } from "@/hooks/useDashboardQuery";
import { Plus, RefreshCw, Search, ShieldCheck } from "lucide-react";
import type { AppDispatch, RootState } from "@/store";
import { loginSuccess, logout } from "@/store/slices/authSlice";
import { clearTokens } from "@/lib/token";
import { ApiError } from "@/lib/ApiError";
import { normalizeAuthUser } from "@/services/googleAuth";
import { getRoles } from "@/services/roles";
import {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
} from "@/services/usersApi";
import type {
  ManagedUser,
  CreateUserInput,
  UpdateUserInput,
} from "@/types/userManagement";
import {
  filterUsers,
  roleLabel,
  standardRoleNames,
} from "@/lib/userManagement";
import { Modal } from "../projects/ProjectUI";
import UserForm from "./UserForm";
import styles from "./UsersDashboard.module.css";

function message(error: unknown) {
  if (error instanceof ApiError && error.statusCode === 403)
    return "Only administrators can manage users.";
  return error instanceof Error
    ? error.message
    : "Unable to load this information.";
}
function roleTone(role?: string) {
  return role === "ADMIN"
    ? "blue"
    : role === "SALES_MANAGER"
      ? "green"
      : role === "PROJECT_MANAGER"
        ? "purple"
        : ["ACCOUNTANT", "FINANCE"].includes(role ?? "")
          ? "amber"
          : "blue";
}

const rolePermissionLevels: Record<string, readonly string[]> = {
  ADMIN: ["Admin", "Admin", "Admin", "Admin", "Admin", "Admin"],
  SALES_MANAGER: ["—", "Write", "Write", "Read", "—", "—"],
  PROJECT_MANAGER: ["—", "—", "Read", "Write", "Read", "Write"],
  ACCOUNTANT: ["—", "—", "Read", "Read", "Write", "—"],
  CLIENT_PORTAL_USER: ["—", "—", "Read", "Read", "—", "Read"],
};
const permissionModules = [
  "Users",
  "Leads",
  "Quotations",
  "Projects",
  "Finance",
  "Documents",
];

function permissionLevel(roleName: string, moduleIndex: number) {
  return rolePermissionLevels[roleName]?.[moduleIndex] ?? "Custom";
}

function permissionClass(level: string) {
  return level === "Admin"
    ? styles.permissionAdmin
    : level === "Write"
      ? styles.permissionWrite
      : level === "Read"
        ? styles.permissionRead
        : level === "—"
          ? styles.permissionNone
          : styles.permissionCustom;
}

export default function UsersDashboardClient() {
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  if (isLoading) return <p role="status">Loading user management…</p>;
  if (user?.role !== "ADMIN")
    return <p role="alert">Only administrators can manage users.</p>;
  return <UsersDirectory key={user.id} />;
}

function UsersDirectory() {
  const currentUser = useSelector((state: RootState) => state.auth.user)!;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const usersQuery = useDashboardQuery("users:directory", listUsers);
  const rolesQuery = useDashboardQuery("users:roles", getRoles);
  const users = usersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const loading = usersQuery.loading;
  const usersError =
    usersQuery.data === undefined && usersQuery.error
      ? message(usersQuery.error)
      : "";
  const rolesError =
    rolesQuery.data === undefined && rolesQuery.error
      ? message(rolesQuery.error)
      : "";
  const refreshError =
    (usersQuery.data !== undefined && usersQuery.error
      ? message(usersQuery.error)
      : "") ||
    (rolesQuery.data !== undefined && rolesQuery.error
      ? message(rolesQuery.error)
      : "");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>();
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusTarget, setStatusTarget] = useState<ManagedUser | null>(null);
  const [actionError, setActionError] = useState("");
  const mutationLock = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);

  function refresh() {
    setFeedback("");
    void Promise.all([usersQuery.refresh(), rolesQuery.refresh()]);
  }
  const filtered = filterUsers(users, search, filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const selected =
    selectedId === undefined
      ? users[0]
      : users.find((user) => user.id === selectedId);
  const creating = selectedId === "new";
  const roleFilters = [
    ...new Set([
      ...roles.map((role) => role.roleName),
      ...users.flatMap((user) => (user.role ? [user.role.roleName] : [])),
    ]),
  ];
  function choose(id: string) {
    setSelectedId(id);
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      editorRef.current?.focus({ preventScroll: true });
    });
  }
  function updateOwnSession(user: ManagedUser) {
    if (user.id !== currentUser.id) return;
    if (
      user.status === "INACTIVE" ||
      user.role?.roleName !== currentUser.role
    ) {
      clearTokens();
      dispatch(logout());
      router.replace("/login");
      return;
    }
    dispatch(
      loginSuccess({
        user: {
          ...normalizeAuthUser({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role?.roleName ?? null,
          }),
          avatarUrl: currentUser.avatarUrl,
        },
      }),
    );
  }
  async function save(input: CreateUserInput & UpdateUserInput) {
    if (mutationLock.current)
      throw new Error("An account change is already in progress.");
    mutationLock.current = true;
    setBusy(true);
    try {
      const result = creating
        ? await createUser(input)
        : await updateUser(selected!.id, input);
      usersQuery.setData((items) =>
        creating
          ? [result, ...(items ?? [])]
          : (items ?? []).map((item) =>
              item.id === result.id ? result : item,
            ),
      );
      setSelectedId(result.id);
      if (creating) {
        setSearch("");
        setFilter("ALL");
        setPage(1);
      }
      setFeedback(
        creating ? "User created successfully." : "User updated successfully.",
      );
      updateOwnSession(result);
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }
  async function changeStatus() {
    if (!statusTarget || mutationLock.current) return;
    mutationLock.current = true;
    setBusy(true);
    setActionError("");
    try {
      let result: ManagedUser;
      if (statusTarget.status === "ACTIVE") {
        await deactivateUser(statusTarget.id);
        result = { ...statusTarget, status: "INACTIVE" };
      } else result = await updateUser(statusTarget.id, { status: "ACTIVE" });
      usersQuery.setData((items) =>
        (items ?? []).map((item) => (item.id === result.id ? result : item)),
      );
      setFeedback(
        `Account ${result.status === "ACTIVE" ? "activated" : "deactivated"} successfully.`,
      );
      setStatusTarget(null);
      updateOwnSession(result);
    } catch (error) {
      setActionError(message(error));
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }

  return (
    <section className={styles.page} aria-label="User management">
      <div className={styles.stats}>
        {[
          ["Total Users", users.length, usersError],
          [
            "Active",
            users.filter((user) => user.status === "ACTIVE").length,
            usersError,
          ],
          [
            "Inactive",
            users.filter((user) => user.status === "INACTIVE").length,
            usersError,
          ],
          ["Roles Defined", roles.length, rolesError],
        ].map(([label, value, error]) => (
          <div className={styles.stat} key={label}>
            <p className={styles.statValue}>
              {loading ? "…" : error ? "—" : value}
            </p>
            <p>{label}</p>
          </div>
        ))}
      </div>
      {feedback && (
        <p role="status" className={styles.success}>
          {feedback}
        </p>
      )}
      {refreshError && (
        <div role="status" className={styles.error}>
          Could not refresh the latest data: {refreshError} Existing data is
          still shown. <button onClick={refresh}>Retry</button>
        </div>
      )}
      {rolesError && (
        <p role="alert" className={styles.error}>
          Role catalog: {rolesError} User details can still be edited. Refresh
          to retry.
        </p>
      )}
      <div className={styles.toolbar}>
        <div className={styles.filters} aria-label="Filter users">
          {[
            { value: "ALL", label: "All Users" },
            ...roleFilters.map((role) => ({
              value: role,
              label: roleLabel(role),
            })),
            { value: "UNASSIGNED", label: "Unassigned" },
            { value: "INACTIVE", label: "Inactive" },
          ].map((item) => (
            <button
              key={item.value}
              aria-pressed={filter === item.value}
              disabled={loading || busy}
              className={
                filter === item.value ? styles.filterActive : styles.filter
              }
              onClick={() => {
                setFilter(item.value);
                setPage(1);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.toolbarActions}>
          <label className={styles.search}>
            <Search size={15} />
            <span className="sr-only">Search users</span>
            <input
              type="search"
              placeholder="Search users…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <button
            disabled={loading || busy}
            aria-label="Refresh user directory"
            className={styles.button}
            onClick={refresh}
          >
            <RefreshCw size={15} />
          </button>
          <button
            disabled={loading || busy || !!usersError}
            className={styles.primary}
            onClick={() => choose("new")}
          >
            <Plus size={15} /> Add User
          </button>
        </div>
      </div>
      <div className={styles.layout}>
        <div className={styles.card} aria-busy={loading}>
          {loading ? (
            <p className={styles.state} role="status">
              Loading user directory…
            </p>
          ) : usersError ? (
            <div className={styles.state}>
              <p className={styles.error} role="alert">
                {usersError}
              </p>
              <button className={styles.button} onClick={refresh}>
                Try again
              </button>
            </div>
          ) : (
            <>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <caption className="sr-only">
                    User accounts and account actions
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">User</th>
                      <th scope="col">Role</th>
                      <th scope="col">Status</th>
                      <th scope="col">Last Login</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((user) => (
                      <tr
                        key={user.id}
                        className={
                          selected?.id === user.id ? styles.selected : ""
                        }
                      >
                        <td>
                          <button
                            className={styles.userCell}
                            disabled={busy}
                            aria-label={`Edit ${user.fullName}`}
                            aria-pressed={selected?.id === user.id}
                            onClick={() => choose(user.id)}
                          >
                            <span
                              aria-hidden="true"
                              className={`${styles.avatar} ${styles[`avatar_${roleTone(user.role?.roleName)}`]}`}
                            >
                              {user.fullName
                                .trim()
                                .split(/\s+/)
                                .slice(0, 2)
                                .map((name) => name[0])
                                .join("")
                                .toUpperCase() || "?"}
                            </span>
                            <span>
                              <strong>{user.fullName}</strong>
                              <span className={styles.email}>{user.email}</span>
                            </span>
                          </button>
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${styles[roleTone(user.role?.roleName)]}`}
                          >
                            {roleLabel(user.role?.roleName)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${user.status === "ACTIVE" ? styles.green : styles.red}`}
                          >
                            <span className={styles.dot} />
                            {user.status === "ACTIVE" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className={styles.muted}>Not available</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button
                              disabled={busy}
                              className={`${styles.rowButton} ${styles.blue}`}
                              onClick={() => choose(user.id)}
                            >
                              Edit
                              <span className="sr-only"> {user.fullName}</span>
                            </button>
                            <button
                              disabled={busy}
                              className={`${styles.rowButton} ${user.status === "ACTIVE" ? styles.red : styles.green}`}
                              onClick={() => {
                                setStatusTarget(user);
                                setActionError("");
                              }}
                            >
                              {user.status === "ACTIVE"
                                ? "Deactivate"
                                : "Activate"}
                              <span className="sr-only"> {user.fullName}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={5} className={styles.state}>
                          {users.length
                            ? "No users match these filters."
                            : "No users found. Add a user to get started."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <footer className={styles.pagination}>
                <span aria-live="polite">
                  {filtered.length} {filtered.length === 1 ? "user" : "users"} ·
                  Page {currentPage} of {totalPages}
                </span>
                <div>
                  <button
                    className={styles.button}
                    disabled={currentPage <= 1 || busy}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className={styles.button}
                    disabled={currentPage >= totalPages || busy}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </footer>
            </>
          )}
        </div>
        <aside className={styles.sidePanel}>
          <div ref={editorRef} tabIndex={-1} className={styles.editorAnchor}>
            {!loading && !usersError && (creating || selected) ? (
              <UserForm
                key={
                  creating
                    ? "new"
                    : `${selected!.id}:${selected!.updatedAt}:${selected!.status}`
                }
                user={creating ? null : selected!}
                roles={roles}
                rolesError={!!rolesError}
                disabled={busy || loading}
                onSave={save}
                onCancel={() => setSelectedId(null)}
              />
            ) : (
              <section className={styles.card}>
                <header className={styles.panelHeader}>
                  <h2>User Details</h2>
                  <p>
                    {loading
                      ? "Loading accounts…"
                      : "Select a user to edit, or add a new account."}
                  </p>
                </header>
              </section>
            )}
          </div>
          <section className={styles.card} aria-labelledby="roles-title">
            <header className={styles.panelHeader}>
              <h2 id="roles-title">
                <ShieldCheck size={15} /> Role Permissions Matrix
              </h2>
              <p>Standard backend role permissions by module</p>
            </header>
            <div className={styles.tableScroll}>
              <table className={`${styles.table} ${styles.permissions}`}>
                <caption className="sr-only">
                  Backend seeded role permissions by module
                </caption>
                <thead>
                  <tr>
                    {["Role", ...permissionModules].map((heading) => (
                      <th scope="col" key={heading}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...new Set([
                      ...standardRoleNames,
                      ...roles.map((role) => role.roleName),
                    ]),
                  ].map((roleName) => (
                    <tr key={roleName}>
                      <th
                        scope="row"
                        title={
                          roles.find((role) => role.roleName === roleName)
                            ?.description ?? undefined
                        }
                      >
                        {roleLabel(roleName)}
                      </th>
                      {permissionModules.map((module, index) => {
                        const level = permissionLevel(roleName, index);
                        return (
                          <td key={module}>
                            <span
                              className={`${styles.permission} ${permissionClass(level)}`}
                            >
                              {level}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.matrixNote}>
              Write represents create, update, and delete permissions. Actual
              access is enforced by the server.
            </p>
          </section>
        </aside>
      </div>
      {statusTarget && (
        <Modal
          title={`${statusTarget.status === "ACTIVE" ? "Deactivate" : "Activate"} user?`}
          onClose={() => setStatusTarget(null)}
          busy={busy}
        >
          <div className={styles.confirmBody}>
            {actionError && (
              <p role="alert" className={styles.error}>
                {actionError}
              </p>
            )}
            <p>
              {statusTarget.status === "ACTIVE" ? "Deactivate" : "Activate"}{" "}
              {statusTarget.fullName}&apos;s account?
            </p>
            <p className={styles.muted}>
              {statusTarget.status === "ACTIVE"
                ? "The account will lose access. Its records will be retained."
                : "The account will regain access with its assigned role."}
            </p>
            <div className={styles.confirmActions}>
              <button
                disabled={busy}
                className={styles.button}
                onClick={() => setStatusTarget(null)}
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className={
                  statusTarget.status === "ACTIVE"
                    ? styles.danger
                    : styles.primary
                }
                onClick={() => void changeStatus()}
              >
                {busy ? "Updating…" : "Confirm"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
