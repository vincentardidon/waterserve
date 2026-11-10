"use client";
import { CheckCircle2, X, AlertCircle } from "lucide-react";
import { useWaterServe } from "../hooks/useWaterServe";
import { SiteHeader } from "../components/layout/SiteHeader";
import { HomePage } from "../components/resident/HomePage";
import { ReportIssuePage } from "../components/resident/ReportIssuePage";
import { ReportConfirmationPage } from "../components/resident/ReportConfirmationPage";
import { TrackReportPage } from "../components/resident/TrackReportPage";
import { MyReportsPage } from "../components/resident/MyReportsPage";
import { NotificationsPage } from "../components/resident/NotificationsPage";
import { AccountAccessPage } from "../components/auth/AccountAccessPage";
import { DashboardPage } from "../components/staff/DashboardPage";
import { IncidentListPage } from "../components/staff/IncidentListPage";
import { CustomerDirectoryPage } from "../components/staff/CustomerDirectoryPage";
import { StaffManagementPage } from "../components/staff/StaffManagementPage";
import { AccountSettingsPage } from "../components/staff/AccountSettingsPage";
import { SiteFooter } from "../components/layout/SiteFooter";
import { IncidentDetailsModal } from "../components/incidents/IncidentDetailsModal";

/** Composes the application shell; behavior lives in useWaterServe. */
export default function WaterServePage() {
  const controller = useWaterServe();
  const { page, user, ready, error, setError, toast, selected } = controller;
  return (
    <div className={user ? "app staff-app" : "app"}>
      <div className="water-droplets" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <SiteHeader {...controller} />
      {ready && !user && page === "home" && <HomePage />}
      <main className={ready && !user && page === "home" ? "hidden" : "main section"}>
        {error && (
          <div role="alert" className="error-banner">
            <AlertCircle size={18} />
            {error}
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {!ready && <p className="loading">Loading your WaterServe account…</p>}
        {ready && !user && page === "login" && <AccountAccessPage {...controller} />}
        {ready && user?.role === "customer" && page === "report" && <ReportIssuePage {...controller} />}
        {ready && user?.role === "customer" && page === "confirmation" && (
          <ReportConfirmationPage {...controller} />
        )}
        {ready && user?.role === "customer" && page === "track" && <TrackReportPage {...controller} />}
        {ready && user?.role === "customer" && page === "notifications" && (
          <NotificationsPage {...controller} />
        )}
        {ready && user?.role === "customer" && page === "myreports" && (
          <MyReportsPage {...controller} />
        )}
        {ready && user && page !== "home" && (
          <>
            <div className="workspace-label">
              <span className="live-dot" />
              {user.role === "customer"
                ? "CUSTOMER ACCOUNT"
                : user.role === "admin"
                ? "ADMINISTRATIVE WORKSPACE"
                : "FIELD MAINTENANCE WORKSPACE"}
              <span>CALBAYOG CITY</span>
            </div>
            {user.role !== "customer" && page === "dashboard" && <DashboardPage {...controller} />}
            {user.role !== "customer" && page === "incidents" && <IncidentListPage {...controller} />}
            {page === "customers" && user.role === "admin" && (
              <CustomerDirectoryPage {...controller} />
            )}
            {page === "team" && user.role === "admin" && (
              <StaffManagementPage {...controller} />
            )}
            {page === "settings" && <AccountSettingsPage {...controller} />}
          </>
        )}
      </main>
      <SiteFooter />
      {selected && user && <IncidentDetailsModal {...controller} />}
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}
    </div>
  );
}
