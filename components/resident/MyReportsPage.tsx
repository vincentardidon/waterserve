"use client";
import { ArrowRight, Plus, FileText } from "lucide-react";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import type { WaterServeController } from "../../hooks/useWaterServe";

type Props = Pick<WaterServeController, "navigateTo" | "trackReport" | "reports">;

export function MyReportsPage({ navigateTo, trackReport, reports }: Props) {
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow blue">YOUR WATER SERVICE CONCERNS</div>
        <h1>My reports</h1>
        <p>Reports submitted from your account, available wherever you sign in.</p>
      </div>
      <div className="saved-list">
        {reports.length ? (
          reports.map((report) => (
            <button
              className="saved-report panel"
              key={report.id}
              onClick={() => trackReport(report.code)}
            >
              <span className="service-icon"><FileText size={23} /></span>
              <div><b>{report.type}</b><small>{report.code}</small></div>
              <StatusBadge status={report.status} />
              <ArrowRight size={20} />
            </button>
          ))
        ) : (
          <div className="panel">
            <EmptyState
              title="Your reports will appear here"
              description="Reports you submit while signed in will be saved to your account."
            />
            <div className="centered">
              <button className="primary" onClick={() => navigateTo("report")}>
                Report an issue
                <Plus size={17} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
