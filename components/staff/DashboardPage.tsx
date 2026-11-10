"use client";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ClipboardList,
  Wrench,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { REPORT_STATUSES } from "../../lib/constants";
import { IncidentTable } from "../../components/incidents/IncidentTable";
import type { WaterServeController } from "../../hooks/useWaterServe";
type Props = Pick<
  WaterServeController,
  | "user"
  | "busy"
  | "reports"
  | "setFilter"
  | "showToast"
  | "navigateTo"
  | "loadWorkspace"
  | "performAction"
  | "openIncident"
>;
export function DashboardPage({
  user,
  busy,
  reports,
  setFilter,
  showToast,
  navigateTo,
  loadWorkspace,
  performAction,
  openIncident,
}: Props) {
  if (!user) return null;

  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <h1>Good to see you, {user.name.split(" ")[0]}.</h1>
          <p>
            {user.role === "admin"
              ? "Here’s what’s happening with water service reports."
              : "Your work orders, priorities, and progress in one place."}
          </p>
        </div>
        <button
          className="secondary"
          disabled={busy}
          onClick={() =>
            performAction(async () => {
              await loadWorkspace();
              showToast("Workspace refreshed.");
            })
          }
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
      <div className="stats-grid">
        {[
          {
            name: user.role === "admin" ? "Total reports" : "My work orders",
            count: reports.length,
            icon: ClipboardList,
            cls: "total",
          },
          ...REPORT_STATUSES.filter(
            (s) => user.role === "admin" || s !== "Submitted",
          ).map((s) => ({
            name: s,
            count: reports.filter((r) => r.status === s).length,
            icon:
              s === "Resolved"
                ? CheckCircle2
                : s === "In Progress"
                  ? Wrench
                  : Clock,
            cls: s.toLowerCase().replaceAll(" ", "-"),
          })),
        ].map((s) => (
          <button
            key={s.name}
            className={"stat-card " + s.cls}
            onClick={() => {
              navigateTo("incidents");
              setFilter(
                REPORT_STATUSES.includes(s.name) ? s.name : "All statuses",
              );
            }}
          >
            <div>
              <span>{s.name}</span>
              <s.icon size={19} />
            </div>
            <strong>{s.count.toString().padStart(2, "0")}</strong>
            <small>
              {s.name === "Resolved"
                ? "Successfully completed"
                : s.name === "Submitted"
                  ? "Awaiting review"
                  : s.name === "Assigned"
                    ? "Ready for field work"
                    : s.name === "In Progress"
                      ? "Repairs underway"
                      : "Across your workspace"}
              <ArrowUpRight size={14} />
            </small>
          </button>
        ))}
      </div>
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>
              {user.role === "admin"
                ? "Recent incidents"
                : "Active work orders"}
            </h3>
            <p>
              {user.role === "admin"
                ? "The latest reports and status updates."
                : "Your assigned and ongoing repairs."}
            </p>
          </div>
          <button
            className="text-button"
            onClick={() => navigateTo("incidents")}
          >
            View all
            <ArrowRight size={16} />
          </button>
        </div>
        {
          <IncidentTable
            rows={(user.role === "admin"
              ? reports
              : reports.filter((r) => r.status !== "Resolved")
            ).slice(0, 6)}
            onOpen={openIncident}
          />
        }
      </div>
      <div className="dashboard-note">
        <ShieldCheck size={17} />
        <p>
          Updates are saved to WaterServe. Residents can follow
          progress with their tracking code.
        </p>
      </div>
    </>
  );
}
