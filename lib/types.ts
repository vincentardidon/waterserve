/** Staff records are separate from residents, who do not need accounts. */
export interface StaffMember {
  id: string;
  name: string;
  email?: string;
  role: string;
}

/** A timestamped entry in an incident's public update history. */
export interface ReportHistoryEntry {
  id: string;
  status: string;
  note: string;
  time: string;
  actor?: string;
}

/** Report fields that can be returned by the public tracking endpoint. */
export interface PublicReport {
  code: string;
  type: string;
  description: string;
  barangay: string;
  status: string;
  created: string;
  updated: string;
}

/** Full record, available only in authorized staff workspaces. */
export interface IncidentReport extends PublicReport {
  id: string;
  name: string;
  phone: string;
  address: string;
  account?: string;
  assigned: string | null;
  history: ReportHistoryEntry[];
}

export interface TrackingResult {
  report: PublicReport;
  history: ReportHistoryEntry[];
}

export interface ReportNotification extends ReportHistoryEntry {
  code: string;
  type: string;
}
