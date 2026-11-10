"use client";
import { Lock } from "lucide-react";
import { waterServeRequest } from "../../lib/water-serve-api";
import type { WaterServeController } from "../../hooks/useWaterServe";
import { PasswordInput } from "../shared/PasswordInput";
type Props = Pick<
  WaterServeController,
  "user" | "setUser" | "busy" | "showToast" | "navigateTo" | "performAction"
>;
export function AccountSettingsPage({
  user,
  setUser,
  busy,
  showToast,
  navigateTo,
  performAction,
}: Props) {
  if (!user) return null;

  return (
    <form
      className="panel auth-form setup-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        performAction(async () => {
          await waterServeRequest("password", Object.fromEntries(f));
          setUser(null);
          navigateTo("login");
          showToast("Password changed. Please sign in again.");
        });
      }}
    >
      <h2>Account security</h2>
      <p>
        {user.name} · {user.email}
      </p>
      <PasswordInput
        label="Current password"
        name="current"
        required
        autoComplete="current-password"
      />
      <PasswordInput
        label="New password"
        name="password"
        required
        minLength={12}
        maxLength={128}
        autoComplete="new-password"
        helper={
          <small>Use at least 12 characters. Updating signs you out.</small>
        }
      />
      <button className="primary" disabled={busy}>
        Update password
        <Lock size={17} />
      </button>
    </form>
  );
}
