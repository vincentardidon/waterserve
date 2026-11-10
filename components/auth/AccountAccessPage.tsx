"use client";
import { useState } from "react";
import { ArrowRight, Droplets, ShieldCheck } from "lucide-react";
import type { WaterServeController } from "../../hooks/useWaterServe";
import { PasswordInput } from "../shared/PasswordInput";

type Props = Pick<WaterServeController, "ready" | "busy" | "navigateTo" | "login" | "signup" | "passwordReset">;

export function AccountAccessPage({ ready, busy, navigateTo, login, signup, passwordReset }: Props) {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  return (
    <div className="auth-layout">
      <div className="auth-intro">
        <div className="eyebrow blue">WATERSERVE ACCOUNT</div>
        <h1>One sign in.<br />Your right workspace.</h1>
        <p>Sign in with your account. WaterServe checks your account role and opens the right services automatically.</p>
        <div className="auth-feature"><ShieldCheck /><span>Secure, role-based access<br /><small>For residents, administrators, and maintenance staff.</small></span></div>
      </div>
      <form className="panel auth-form" onSubmit={mode === "login" ? login : mode === "signup" ? signup : passwordReset}>
        <span className="service-icon"><Droplets size={24} /></span>
        <h2>{mode === "login" ? "Welcome back." : mode === "signup" ? "Create your account." : "Reset your password."}</h2>
        <p>{mode === "signup" ? "Resident accounts help keep your reports together." : mode === "reset" ? "We’ll email a secure password reset link." : "Enter your details to continue."}</p>
        {mode === "signup" && <label>Full name<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>}
        <label>Email address<input type="email" name="email" required autoComplete="email" placeholder="you@example.com" /></label>
        {mode !== "reset" && <PasswordInput label="Password" name="password" required minLength={mode === "signup" ? 12 : undefined} maxLength={128} autoComplete={mode === "signup" ? "new-password" : "current-password"} helper={mode === "signup" ? <small>At least 12 characters.</small> : undefined} />}
        <button className="primary" disabled={busy || !ready}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}<ArrowRight size={18} />
        </button>
        <div className="setup-prompt">
          {mode === "login" && <>New resident? <button type="button" className="text-button" onClick={() => setMode("signup")}>Create an account</button><br /><button type="button" className="text-button" onClick={() => setMode("reset")}>Forgot password?</button></>}
          {mode === "signup" && <>Already have an account? <button type="button" className="text-button" onClick={() => setMode("login")}>Sign in</button></>}
          {mode === "reset" && <button type="button" className="text-button" onClick={() => setMode("login")}>Back to sign in</button>}
        </div>
        <small className="muted">Administrator and maintenance accounts are provided by WaterServe administrators.</small>
        <small className="muted">Sign in once to access your WaterServe account. Your session will be remembered on this device until you sign out.</small>
      </form>
    </div>
  );
}
