"use client";

import { useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import type { RoleOption } from "@/services/roles";
import type {
  ManagedUser,
  CreateUserInput,
  UpdateUserInput,
  AccountStatus,
} from "@/types/userManagement";
import { splitName, roleLabel, validateUserForm } from "@/lib/userManagement";
import { Modal } from "../projects/ProjectUI";
import styles from "./UsersDashboard.module.css";

export default function UserForm({
  user,
  roles,
  rolesError,
  disabled,
  onSave,
  onCancel,
}: {
  user: ManagedUser | null;
  roles: RoleOption[];
  rolesError: boolean;
  disabled: boolean;
  onSave: (input: CreateUserInput & UpdateUserInput) => Promise<void>;
  onCancel: () => void;
}) {
  const names = splitName(user?.fullName ?? "");
  const [values, setValues] = useState({
    ...names,
    email: user?.email ?? "",
    roleId: user?.roleId ?? "",
    status: user?.status ?? ("ACTIVE" as AccountStatus),
    password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const lock = useRef(false);
  const set = (key: keyof typeof values, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  async function save() {
    if (lock.current || disabled) return;
    lock.current = true;
    setSaving(true);
    setError("");
    try {
      await onSave({
        fullName: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
        email: values.email.trim(),
        ...(values.roleId ? { roleId: values.roleId } : {}),
        ...(user
          ? { status: values.status as AccountStatus }
          : values.password
            ? { password: values.password }
            : {}),
      });
      setValues((current) => ({ ...current, password: "" }));
      setConfirm(false);
    } catch (error) {
      setConfirm(false);
      setError(
        error instanceof Error ? error.message : "Unable to save this account.",
      );
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const message = validateUserForm(values);
    if (message) {
      setError(message);
      return;
    }
    if (user && values.status !== user.status) setConfirm(true);
    else void save();
  }
  const knownRole =
    !values.roleId || roles.some((role) => role.id === values.roleId);
  return (
    <section className={styles.card} aria-labelledby="user-editor-title">
      <header className={styles.panelHeader}>
        <h2 id="user-editor-title">
          {user ? `Edit User — ${user.fullName}` : "Add User"}
        </h2>
        <p>
          {user
            ? "Update user details and role assignment"
            : "Create an account and assign an existing role"}
        </p>
      </header>
      <form onSubmit={submit}>
        <fieldset disabled={disabled || saving} className={styles.formBody}>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.formRow}>
            <label>
              First Name
              <input
                autoComplete="given-name"
                required
                maxLength={100}
                value={values.firstName}
                onChange={(event) => set("firstName", event.target.value)}
              />
            </label>
            <label>
              Last Name
              <input
                autoComplete="family-name"
                maxLength={150}
                value={values.lastName}
                onChange={(event) => set("lastName", event.target.value)}
              />
            </label>
          </div>
          <label>
            Email Address
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={values.email}
              onChange={(event) => set("email", event.target.value)}
            />
          </label>
          <label>
            Role
            <select
              value={values.roleId}
              disabled={rolesError}
              onChange={(event) => set("roleId", event.target.value)}
            >
              <option value="" disabled={!!user?.roleId}>
                Unassigned
              </option>
              {!knownRole && (
                <option value={values.roleId}>
                  {roleLabel(user?.role?.roleName)}
                </option>
              )}
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {roleLabel(role.roleName)}
                </option>
              ))}
            </select>
          </label>
          {rolesError && (
            <p className={styles.muted}>
              Roles could not load. Refresh the directory to change role
              assignments.
            </p>
          )}
          <label>
            Account Status
            <select
              disabled={!user}
              value={values.status}
              onChange={(event) => set("status", event.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
          {!user && (
            <>
              <p className={styles.muted}>New accounts start active.</p>
              <label>
                Password <span className={styles.muted}>(optional)</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={values.password}
                  onChange={(event) => set("password", event.target.value)}
                  aria-describedby="password-help"
                />
              </label>
              <p id="password-help" className={styles.muted}>
                Set a password for email sign-in. Google accounts can connect
                using the same email address.
              </p>
            </>
          )}
        </fieldset>
        <footer className={styles.formFooter}>
          <button
            type="button"
            disabled={saving || disabled}
            className={styles.button}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button disabled={saving || disabled} className={styles.primary}>
            <Check size={15} />
            {saving ? "Saving…" : user ? "Save Changes" : "Create User"}
          </button>
        </footer>
      </form>
      {confirm && (
        <Modal
          title={`${values.status === "ACTIVE" ? "Activate" : "Deactivate"} account?`}
          onClose={() => setConfirm(false)}
          busy={saving}
        >
          <div className={styles.confirmBody}>
            <p>
              Save changes and{" "}
              {values.status === "ACTIVE" ? "activate" : "deactivate"}{" "}
              {user?.fullName}&apos;s account?
            </p>
            <p className={styles.muted}>
              {values.status === "INACTIVE"
                ? "This account will lose access to ConstructPro."
                : "This account will regain access with its assigned role."}
            </p>
            <div className={styles.confirmActions}>
              <button
                disabled={saving}
                className={styles.button}
                onClick={() => setConfirm(false)}
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className={styles.primary}
                onClick={() => void save()}
              >
                {saving ? "Saving…" : "Confirm changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
