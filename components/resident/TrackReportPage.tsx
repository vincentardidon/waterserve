"use client";
import {
  ArrowRight,
  Check,
  Search,
  MapPin,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { REPORT_STATUSES, formatTimestamp } from "../../lib/constants";
import { StatusBadge } from "../../components/shared/StatusBadge";
import type { WaterServeController } from "../../hooks/useWaterServe";
type Props = Pick<
  WaterServeController,
  "busy" | "tracked" | "code" | "setCode" | "trackReport"
>;
export function TrackReportPage({
  busy,
  tracked,
  code,
  setCode,
  trackReport,
}: Props) {
  return (
    <>
      <div className="page-heading centered">
        <div className="eyebrow blue">EVERY UPDATE, IN ONE PLACE</div>
        <h1>Where is your report now?</h1>
        <p>
          Enter the tracking code you received when you submitted your report.
        </p>
      </div>
      <form
        className="track-search panel"
        onSubmit={(e) => {
          e.preventDefault();
          trackReport();
        }}
      >
        <Search size={22} />
        <input
          aria-label="Tracking code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="WS-XXXXXXXXXXXXXXXX"
        />
        <button className="primary" disabled={busy}>
          {busy ? "Searching…" : "Track report"}
          <ArrowRight size={17} />
        </button>
      </form>
      {tracked && (
        <div className="tracking-result panel">
          <div className="detail-top">
            <div>
              <small>{tracked.report.code}</small>
              <h2>{tracked.report.type}</h2>
              <p>
                <MapPin size={15} />
                {tracked.report.barangay}, Calbayog City
              </p>
            </div>
            <StatusBadge status={tracked.report.status} />
          </div>
          <div className="progress-steps">
            {REPORT_STATUSES.map((s, i) => (
              <div
                key={s}
                className={
                  i <= REPORT_STATUSES.indexOf(tracked.report.status)
                    ? "complete"
                    : ""
                }
              >
                <span>
                  {i < REPORT_STATUSES.indexOf(tracked.report.status) ? (
                    <Check size={16} />
                  ) : (
                    i + 1
                  )}
                </span>
                <b>{s}</b>
              </div>
            ))}
          </div>
          <div className="tracking-columns">
            <div>
              <h3>Report details</h3>
              <p className="description">{tracked.report.description}</p>
              <small className="muted">
                Reported {formatTimestamp(tracked.report.created)}
              </small>
              <p className="private-note">
                <ShieldCheck size={16} />
                Your contact details and exact address stay private.
              </p>
            </div>
            <div>
              <h3>Update history</h3>
              <div className="timeline">
                {tracked.history
                  .slice()
                  .reverse()
                  .map((h: any) => (
                    <div key={h.id}>
                      <i />
                      <strong>{h.status}</strong>
                      <small>{formatTimestamp(h.time)}</small>
                      <p>{h.note}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className="panel-bottom">
            <span>
              <RefreshCw size={14} />
              This page checks for new updates every 30 seconds
            </span>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => trackReport()}
            >
              Refresh now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
