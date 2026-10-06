"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Link from "next/link";
import AuthButton from "@/components/ui/AuthButton";
import apiClient from "@/lib/axios";
import { getAccessToken } from "@/lib/token";
import { normalizeAuthUser } from "@/services/googleAuth";
import {
  getRoles,
  needsRoleSelection,
  saveSelectedRole,
  type RoleOption,
} from "@/services/roles";
import { ApiError } from "@/lib/ApiError";
import { loginSuccess } from "@/store/slices/authSlice";

export default function RoleSelection() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [saveError, setSaveError] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    async function load() {
      try {
        const profile = await apiClient.get<unknown>("/auth/me");
        const user = normalizeAuthUser(profile.data);
        if (!active) return;
        dispatch(loginSuccess({ user }));
        setUserId(user.id);
        if (!needsRoleSelection(user)) {
          router.replace("/modules");
          return;
        }
        const options = await getRoles();
        if (active) setRoles(options);
      } catch {
        if (active) setError("Unable to load roles. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [attempt, dispatch, router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedRole = roles.find((role) => role.id === roleId);
    if (!selectedRole || !userId || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const user = await saveSelectedRole(userId, selectedRole);
      dispatch(loginSuccess({ user }));
      router.replace("/modules");
    } catch (error) {
      setSaveError(
        error instanceof ApiError && error.statusCode === 403
          ? "Your account is not allowed to assign a role. Contact your administrator."
          : "Unable to save your role. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-on-background">
        Choose your role
      </h1>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading roles...</p>
      ) : error ? (
        <AuthButton
          onClick={() => {
            setError("");
            setLoading(true);
            setAttempt((value) => value + 1);
          }}
        >
          Try again
        </AuthButton>
      ) : roles.length ? (
        <form onSubmit={submit} className="space-y-4">
          <label
            htmlFor="selected-role"
            className="block text-sm font-semibold"
          >
            Role
          </label>
          <select
            id="selected-role"
            required
            disabled={saving}
            value={roleId}
            onChange={(event) => setRoleId(event.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-on-background"
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.roleName.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <p className="text-sm text-on-surface-muted">
            {roles.find((role) => role.id === roleId)?.description}
          </p>
          {saveError && (
            <p role="alert" className="text-sm text-error">
              {saveError}
            </p>
          )}
          <AuthButton
            type="submit"
            disabled={!roleId || !userId}
            isLoading={saving}
          >
            Save role and continue
          </AuthButton>
        </form>
      ) : (
        <p>No roles are available.</p>
      )}
      <Link href="/modules" className="block text-sm font-bold text-action">
        Continue with current access
      </Link>
    </div>
  );
}
