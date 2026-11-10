"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "../../components/shared/PasswordInput";
import { waterServeRequest } from "../../lib/water-serve-api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      await waterServeRequest("new-password", { password: form.get("password") });
      router.replace("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Password reset failed.");
      setBusy(false);
    }
  }
  return (
    <main className="main section">
      <form className="panel auth-form setup-form" onSubmit={submit}>
        <div className="eyebrow blue">ACCOUNT RECOVERY</div>
        <h2>Choose a new password.</h2>
        <p>Use at least 12 characters. You will need to sign in again afterward.</p>
        <PasswordInput label="New password" name="password" required minLength={12} maxLength={128} autoComplete="new-password" />
        {error && <div role="alert" className="error-banner">{error}</div>}
        <button className="primary" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
      </form>
    </main>
  );
}
