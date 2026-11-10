"use client";
import { ArrowRight, Check, Copy } from "lucide-react";
import type { WaterServeController } from "../../hooks/useWaterServe";
type Props = Pick<WaterServeController, "success" | "showToast" | "trackReport">;
export function ReportConfirmationPage({
  success,
  showToast,
  trackReport,
}: Props) {
  return (
    <div className="confirmation panel">
      <span className="success-icon">
        <Check size={34} />
      </span>
      <div className="eyebrow blue">REPORT SUCCESSFULLY SUBMITTED</div>
      <h1>Thank you for speaking up.</h1>
      <p>We’ve received your report. Save this code to follow its progress.</p>
      <div className="tracking-code">
        <small>YOUR TRACKING CODE</small>
        <b>{success}</b>
        <button
          className="text-button"
          onClick={() =>
            navigator.clipboard
              .writeText(success)
              .then(() => showToast("Tracking code copied."))
              .catch(() =>
                showToast("Select and copy the tracking code above."),
              )
          }
        >
          <Copy size={15} />
          Copy code
        </button>
      </div>
      <button className="primary" onClick={() => trackReport(success)}>
        Track this report
        <ArrowRight size={18} />
      </button>
      <p className="muted">
        This report is linked to your account and appears in My reports when you sign in.
      </p>
    </div>
  );
}
