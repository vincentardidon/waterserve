"use client";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Wrench,
  X,
  Phone,
} from "lucide-react";
import { formatTimestamp } from "../../lib/constants";
import { StatusBadge } from "../../components/shared/StatusBadge";
import type { WaterServeController } from "../../hooks/useWaterServe";
type Props = Pick<
  WaterServeController,
  | "user"
  | "busy"
  | "error"
  | "setError"
  | "staff"
  | "selected"
  | "setSelected"
  | "updateIncident"
>;
export function IncidentDetailsModal({
  user,
  busy,
  error,
  setError,
  staff,
  selected,
  setSelected,
  updateIncident,
}: Props) {
  if (!selected || !user) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelected(null);
          setError("");
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        className="detail-modal"
      >
        <div className="modal-header">
          <span>INCIDENT DETAILS</span>
          <button
            aria-label="Close details"
            className="icon-button"
            onClick={() => {
              setSelected(null);
              setError("");
            }}
          >
            <X size={22} />
          </button>
        </div>
        <div className="modal-body">
          {error && (
            <div role="alert" className="error-banner">
              {error}
            </div>
          )}
          <div className="detail-top">
            <div>
              <small>{selected.code}</small>
              <h2 id="detail-title">{selected.type}</h2>
              <p>Reported {formatTimestamp(selected.created)}</p>
            </div>
            <StatusBadge status={selected.status} />
          </div>
          <div className="detail-grid">
            <div>
              <h4>RESIDENT</h4>
              <b>{selected.name}</b>
              <p>
                <Phone size={14} />
                <a href={"tel:" + selected.phone}>{selected.phone}</a>
              </p>
              <small>Account: {selected.account || "Not provided"}</small>
            </div>
            <div>
              <h4>SERVICE LOCATION</h4>
              <b>{selected.barangay}</b>
              <p>
                <MapPin size={15} />
                {selected.address}
              </p>
              <small>Calbayog City, Samar</small>
            </div>
          </div>
          <h3>Issue description</h3>
          <p className="description">{selected.description}</p>
          {user.role === "admin" &&
            ["Submitted", "Assigned"].includes(selected.status) && (
              <form
                className="action-box"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  updateIncident({
                    action: "assign",
                    staffId: f.get("staffId"),
                  });
                }}
              >
                <h3>Assign maintenance personnel</h3>
                <p>Choose a team member to create their work order.</p>
                <div className="inline-form">
                  <select
                    aria-label="Maintenance personnel"
                    required
                    name="staffId"
                    defaultValue={selected.assigned || ""}
                  >
                    <option value="" disabled>
                      Select personnel
                    </option>
                    {staff
                      .filter((s) => s.role === "maintenance")
                      .map((s) => (
                        <option value={s.id} key={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  <button className="primary" disabled={busy}>
                    Assign worker
                    <ArrowRight size={17} />
                  </button>
                </div>
                {!staff.some((s) => s.role === "maintenance") && (
                  <p className="muted">
                    Add a maintenance account in Staff & access first.
                  </p>
                )}
              </form>
            )}
          {selected.assigned && (
            <p className="assignment-line">
              <Wrench size={16} />
              Assigned to{" "}
              <b>
                {staff.find((s) => s.id === selected.assigned)?.name ||
                  "your maintenance team"}
              </b>
            </p>
          )}
          {selected.status === "Assigned" && (
            <div className="action-box">
              <h3>Ready to begin?</h3>
              <p>Starting this job updates the resident’s tracking page.</p>
              <button
                className="primary"
                disabled={busy}
                onClick={() => updateIncident({ action: "start" })}
              >
                Start work
                <Wrench size={17} />
              </button>
            </div>
          )}
          {selected.status === "In Progress" && (
            <form
              className="action-box"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                updateIncident({
                  action: "resolve",
                  notes: f.get("notes"),
                });
              }}
            >
              <h3>Complete this repair</h3>
              <p>
                Repair notes are visible to the resident. Avoid private contact
                information.
              </p>
              <label>
                Resolution notes
                <textarea
                  name="notes"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={3}
                  placeholder="Describe the repair and outcome…"
                />
              </label>
              <button className="primary" disabled={busy}>
                Mark as resolved
                <CheckCircle2 size={17} />
              </button>
            </form>
          )}
          <h3 className="history-title">Activity history</h3>
          <div className="timeline">
            {selected.history
              .slice()
              .reverse()
              .map((h: any) => (
                <div key={h.id}>
                  <i />
                  <strong>{h.status}</strong>
                  <small>
                    {formatTimestamp(h.time)} · {h.actor}
                  </small>
                  <p>{h.note}</p>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
