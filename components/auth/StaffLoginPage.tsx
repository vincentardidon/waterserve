"use client";
import { useState } from "react";
import { ArrowRight, Users, Wrench, ShieldCheck, Lock } from "lucide-react";
import type { WaterServeController } from "../../hooks/useWaterServe";
import { PasswordInput } from "../shared/PasswordInput";
type Props = Pick<
  WaterServeController,
  "needsSetup" | "ready" | "busy" | "role" | "setRole" | "navigateTo" | "login"
>;
export function StaffLoginPage({
  needsSetup,
  ready,
  busy,
  role,
  setRole,
  navigateTo,
  login,
}: Props) {
  const [showRecoveryHelp, setShowRecoveryHelp] = useState(false);

  return (
    <div className="auth-layout">
      <div className="auth-intro">
        <div className="eyebrow blue">CCWD STAFF PORTAL</div>
        <h1>
          A connected team.
          <br />A better response.
        </h1>
        <p>
          Review reports, coordinate field repairs, and keep residents informed
          at every step.
        </p>
        <div className="auth-feature">
          <ShieldCheck />
          <span>
            Role-based workspace preview
            <br />
            <small>For administrator and maintenance demos.</small>
          </span>
        </div>
      </div>
      <form className="panel auth-form" onSubmit={login}>
        <span className="service-icon">
          <Lock size={24} />
        </span>
        <h2>Welcome back.</h2>
        <p>Sign in to your workspace.</p>
        <div className="role-switch">
          <button
            type="button"
            className={role === "admin" ? "selected" : ""}
            onClick={() => setRole("admin")}
          >
            <Users size={17} />
            Administrator
          </button>
          <button
            type="button"
            className={role === "maintenance" ? "selected" : ""}
            onClick={() => setRole("maintenance")}
          >
            <Wrench size={17} />
            Maintenance
          </button>
        </div>
        <label>
          Email address
          <input
            type="email"
            name="email"
            required
            autoComplete="username"
            placeholder="you@example.com"
          />
        </label>
        <PasswordInput
          label="Password"
          name="password"
          required
          autoComplete="current-password"
        />
        <div className="recovery-prompt">
          <button
            type="button"
            className="text-button"
            aria-expanded={showRecoveryHelp}
            onClick={() => setShowRecoveryHelp((current) => !current)}
          >
            Forgot password?
          </button>
        </div>
        {showRecoveryHelp && (
          <p className="recovery-help" role="status">
            Email recovery is not available in this browser-only prototype. If
            you are maintenance staff, ask the administrator to set a new
            password for your account in Staff &amp; access.
          </p>
        )}
        <button className="primary" disabled={busy || !ready}>
          {busy ? "Signing in…" : "Sign in"}
          <ArrowRight size={18} />
        </button>
        {needsSetup && (
          <div className="setup-prompt">
            First time here?{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => navigateTo("setup")}
            >
              Set up administrator
            </button>
          </div>
        )}
        <small className="muted">
          Residents can report and track issues without signing in.
        </small>
        <small className="muted">
          Prototype mode: reports and accounts stay in this browser and are not
          shared between devices.
        </small>
      </form>
    </div>
  );
}
