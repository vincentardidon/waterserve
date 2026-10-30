"use client";
import { ArrowRight } from "lucide-react";
import type { WaterServeController } from "../../hooks/useWaterServe";
import { PasswordInput } from "../shared/PasswordInput";
type Props = Pick<WaterServeController, "busy" | "setup">;
export function AdministratorSetupPage({ busy, setup }: Props) {
  return (
    <form className="panel auth-form setup-form" onSubmit={setup}>
      <div className="eyebrow blue">FIRST-TIME SETUP</div>
      <h2>Create your administrator.</h2>
      <p>
        This prototype saves accounts in this browser only. Setup is available
        until the first administrator account is created.
      </p>
      <label>
        Full name
        <input name="name" required minLength={2} maxLength={100} />
      </label>
      <label>
        Email address
        <input name="email" type="email" required />
      </label>
      <PasswordInput
        label="Password"
        name="password"
        required
        minLength={12}
        maxLength={128}
        autoComplete="new-password"
        helper={<small>At least 12 characters.</small>}
      />
      <button className="primary" disabled={busy}>
        {busy ? "Creating…" : "Create administrator"}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
