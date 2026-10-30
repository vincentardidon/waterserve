"use client";
import { useState } from "react";
import { KeyRound, Plus } from "lucide-react";
import { prototypeRequest } from "../../lib/prototype-store";
import type { WaterServeController } from "../../hooks/useWaterServe";
import { PasswordInput } from "../shared/PasswordInput";
type Props = Pick<
  WaterServeController,
  "busy" | "staff" | "showToast" | "loadWorkspace" | "performAction"
>;
export function StaffManagementPage({
  busy,
  staff,
  showToast,
  loadWorkspace,
  performAction,
}: Props) {
  const [resettingStaffId, setResettingStaffId] = useState<string | null>(null);

  return (
    <>
      <div className="page-heading">
        <h1>A team that keeps things flowing.</h1>
        <p>
          Create staff credentials and use maintenance accounts to assign field
          work.
        </p>
      </div>
      <div className="team-layout">
        <div className="panel">
          <div className="panel-heading">
            <h3>Staff directory</h3>
            <span className="count">{staff.length} members</span>
          </div>
          {staff.map((s) => (
            <div key={s.id}>
              <div className="staff-row">
                <span className="avatar">{s.name[0]}</span>
                <div>
                  <b>{s.name}</b>
                  <small>{s.email}</small>
                </div>
                <span className="staff-role">{s.role}</span>
                {s.role === "maintenance" && (
                  <button
                    className="text-button staff-reset-button"
                    type="button"
                    aria-expanded={resettingStaffId === s.id}
                    onClick={() =>
                      setResettingStaffId((current) =>
                        current === s.id ? null : s.id,
                      )
                    }
                  >
                    Reset password
                  </button>
                )}
              </div>
              {resettingStaffId === s.id && (
                <form
                  className="staff-reset-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const f = new FormData(form);
                    performAction(async () => {
                      await prototypeRequest("staff-reset-password", {
                        staffId: s.id,
                        password: f.get("password"),
                      });
                      form.reset();
                      setResettingStaffId(null);
                      showToast("Maintenance password reset.");
                    });
                  }}
                >
                  <PasswordInput
                    label={`New password for ${s.name}`}
                    name="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    helper={<small>At least 12 characters.</small>}
                  />
                  <button className="secondary" disabled={busy}>
                    <KeyRound size={16} />
                    Set new password
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
        <form
          className="panel auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            performAction(async () => {
              await prototypeRequest("staff", Object.fromEntries(f));
              await loadWorkspace();
              form.reset();
              showToast("Staff account created.");
            });
          }}
        >
          <h3>Add a staff member</h3>
          <p>
            Share credentials privately. Staff can change passwords from
            Account.
          </p>
          <label>
            Full name
            <input name="name" required minLength={2} maxLength={100} />
          </label>
          <label>
            Email address
            <input name="email" type="email" required />
          </label>
          <label>
            Role
            <select name="role">
              <option value="maintenance">Maintenance</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <PasswordInput
            label="Initial password"
            name="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            helper={<small>At least 12 characters</small>}
          />
          <button className="primary" disabled={busy}>
            Create account
            <Plus size={17} />
          </button>
        </form>
      </div>
    </>
  );
}
