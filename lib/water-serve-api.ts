export type ReportDraft = Record<string, string | boolean>;
const REPORT_DRAFT_KEY = "waterserve.prototype.report-draft.v1";

export function readReportDraft(): ReportDraft {
  const raw = window.localStorage.getItem(REPORT_DRAFT_KEY);
  if (!raw) return {};
  try {
    const draft: unknown = JSON.parse(raw);
    if (typeof draft === "object" && draft !== null && !Array.isArray(draft)) return draft as ReportDraft;
  } catch {
    throw new Error("The saved report draft could not be read.");
  }
  throw new Error("The saved report draft has an unsupported format.");
}

export function saveReportDraft(draft: ReportDraft) {
  try {
    window.localStorage.setItem(REPORT_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    throw new Error("Browser storage is full, so the report draft was not saved.");
  }
}

export function clearReportDraft() {
  window.localStorage.removeItem(REPORT_DRAFT_KEY);
}

export async function waterServeRequest(path: string, body?: unknown): Promise<any> {
  const [route, query = ""] = path.split("?", 2);
  const response = await fetch(`/api/${route}${query ? `?${query}` : ""}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "The request could not be completed.") as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  return result;
}
