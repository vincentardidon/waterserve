"use client";
import { ChevronRight, Bell } from "lucide-react";
import { formatTimestamp } from "../../lib/constants";
import { EmptyState } from "../../components/shared/EmptyState";
import type { WaterServeController } from "../../hooks/useWaterServe";
type Props = Pick<
  WaterServeController,
  "read" | "setRead" | "notifications" | "trackReport"
>;
export function NotificationsPage({
  read,
  setRead,
  notifications,
  trackReport,
}: Props) {
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow blue">STAY IN THE LOOP</div>
        <h1>Report updates</h1>
        <p>
          In-portal alerts for reports linked to your account. Email and SMS
          alerts are not enabled.
        </p>
      </div>
      <div className="panel notification-list">
        {notifications.length ? (
          notifications.map((n) => (
            <button
              key={n.id}
              className={read.includes(n.id) ? "read" : ""}
              onClick={() => {
                const next = [...read, n.id];
                setRead(next);
                localStorage.setItem("ws_read", JSON.stringify(next));
                trackReport(n.code);
              }}
            >
              <span className="service-icon">
                <Bell size={20} />
              </span>
              <div>
                <b>
                  {n.type} · {n.status}
                </b>
                <p>{n.note}</p>
                <small>
                  {n.code} · {formatTimestamp(n.time)}
                </small>
              </div>
              {!read.includes(n.id) && <i className="unread-dot" />}
              <ChevronRight size={18} />
            </button>
          ))
        ) : (
          <EmptyState
            title="You’re all caught up"
            description="Updates to your saved reports will appear here."
          />
        )}
      </div>
    </>
  );
}
