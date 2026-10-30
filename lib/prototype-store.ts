import type {
  IncidentReport,
  PublicReport,
  ReportHistoryEntry,
  StaffMember,
  TrackingResult,
} from "./types";
import { ISSUE_TYPES } from "./constants";

const DATA_KEY = "waterserve.prototype.data.v1";
const SESSION_KEY = "waterserve.prototype.session.v1";
const REPORT_DRAFT_KEY = "waterserve.prototype.report-draft.v1";

export type ReportDraft = Record<string, string | boolean>;

export function readReportDraft(): ReportDraft {
  const raw = window.localStorage.getItem(REPORT_DRAFT_KEY);
  if (!raw) return {};
  try {
    const draft: unknown = JSON.parse(raw);
    if (typeof draft === "object" && draft !== null && !Array.isArray(draft))
      return draft as ReportDraft;
  } catch {
    throw new Error(
      "The saved report draft could not be read. Your browser storage was left unchanged.",
    );
  }
  throw new Error(
    "The saved report draft has an unsupported format. Your browser storage was left unchanged.",
  );
}

export function saveReportDraft(draft: ReportDraft) {
  try {
    window.localStorage.setItem(REPORT_DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError")
      throw new Error(
        "Browser storage is full, so the report draft was not saved.",
      );
    throw error;
  }
}

export function clearReportDraft() {
  window.localStorage.removeItem(REPORT_DRAFT_KEY);
}

interface StoredStaff extends StaffMember {
  email: string;
  passwordHash: string;
}

interface PrototypeData {
  staff: StoredStaff[];
  reports: IncidentReport[];
}

const emptyData = (): PrototypeData => ({ staff: [], reports: [] });

function readData(): PrototypeData {
  const raw = window.localStorage.getItem(DATA_KEY);
  if (!raw) return emptyData();
  try {
    const data: unknown = JSON.parse(raw);
    if (
      typeof data === "object" &&
      data !== null &&
      "staff" in data &&
      Array.isArray(data.staff) &&
      "reports" in data &&
      Array.isArray(data.reports)
    )
      return data as PrototypeData;
  } catch {
    throw new Error(
      "Saved prototype data could not be read. Your browser storage was left unchanged.",
    );
  }
  throw new Error(
    "Saved prototype data has an unsupported format. Your browser storage was left unchanged.",
  );
}

function writeData(data: PrototypeData) {
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("waterserve:storage-change"));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError")
      throw new Error(
        "Browser storage is full, so this change was not saved. Remove some stored reports or clear this prototype's browser data.",
      );
    throw error;
  }
}

function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

function requiredText(
  value: unknown,
  label: string,
  min: number,
  max: number,
): string {
  if (typeof value !== "string") fail(`${label} is required.`);
  const text = value.trim();
  if (text.length < min || text.length > max)
    fail(`${label} must be between ${min} and ${max} characters.`);
  return text;
}

function validateEmail(value: unknown): string {
  const email = requiredText(value, "Email", 5, 150).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail("Enter a valid email address.");
  return email;
}

function publicStaff(staff: StoredStaff): StaffMember {
  return { id: staff.id, name: staff.name, email: staff.email, role: staff.role };
}

function currentStaff(data: PrototypeData): StoredStaff | null {
  const id = window.localStorage.getItem(SESSION_KEY);
  return data.staff.find((staff) => staff.id === id) || null;
}

function requireStaff(data: PrototypeData): StoredStaff {
  const staff = currentStaff(data);
  if (!staff) fail("Please sign in to continue.", 401);
  return staff;
}

async function passwordHash(
  password: string,
  salt?: Uint8Array<ArrayBuffer>,
) {
  const saltBytes = salt || crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 120_000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  const toHex = (bytes: Uint8Array) =>
    Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${toHex(saltBytes)}:${toHex(new Uint8Array(hash))}`;
}

function parsePasswordHash(hash: string): Uint8Array<ArrayBuffer> {
  const saltHex = hash.split(":")[0];
  if (!/^[a-f0-9]{32}$/i.test(saltHex))
    fail("Saved account data is invalid. Clear this prototype's browser data to restart.");
  return Uint8Array.from(
    saltHex.match(/.{2}/g) || [],
    (byte) => Number.parseInt(byte, 16),
  );
}

async function verifyPassword(password: string, hash: string) {
  return (await passwordHash(password, parsePasswordHash(hash))) === hash;
}

function publicReport(report: IncidentReport): PublicReport {
  const { code, type, description, barangay, status, created, updated } =
    report;
  return { code, type, description, barangay, status, created, updated };
}

function getTrackingResult(
  data: PrototypeData,
  rawCode: string | null,
): TrackingResult {
  const code = (rawCode || "").trim().toUpperCase();
  if (!/^WS-[A-F0-9]{16}$/.test(code))
    fail("Enter your complete tracking code.");
  const report = data.reports.find((item) => item.code === code);
  if (!report) fail("No report found. Check your tracking code.", 404);
  return {
    report: publicReport(report),
    history: report.history.map(({ actor: _actor, ...entry }) => entry),
  };
}

function addHistory(
  report: IncidentReport,
  status: string,
  note: string,
  actor: string,
) {
  const now = new Date().toISOString();
  const entry: ReportHistoryEntry = {
    id: crypto.randomUUID(),
    status,
    note,
    actor,
    time: now,
  };
  report.history.push(entry);
  report.status = status;
  report.updated = now;
}

/** Prototype-only data access. All records stay in this browser's localStorage. */
export async function prototypeRequest(
  path: string,
  body?: any,
): Promise<any> {
  const [route, query = ""] = path.split("?", 2);
  const url = new URLSearchParams(query);
  const data = readData();

  if (route === "session") {
    const staff = currentStaff(data);
    return {
      user: staff ? publicStaff(staff) : null,
      needsSetup: data.staff.length === 0,
    };
  }

  if (route === "setup") {
    if (data.staff.length > 0)
      fail("Administrator setup has already been completed.", 409);
    const name = requiredText(body.name, "Name", 2, 100);
    const email = validateEmail(body.email);
    const password = requiredText(body.password, "Password", 12, 128);
    const created: StoredStaff = {
      id: crypto.randomUUID(),
      name,
      email,
      role: "admin",
      passwordHash: await passwordHash(password),
    };
    data.staff.push(created);
    writeData(data);
    return { ok: true };
  }

  if (route === "login") {
    const email = validateEmail(body.email);
    const password = requiredText(body.password, "Password", 1, 128);
    const staff = data.staff.find(
      (item) => item.email === email && item.role === body.role,
    );
    if (!staff || !(await verifyPassword(password, staff.passwordHash)))
      fail("Email, password, or selected role is incorrect.", 401);
    window.localStorage.setItem(SESSION_KEY, staff.id);
    window.dispatchEvent(new Event("waterserve:storage-change"));
    return { ok: true };
  }

  if (route === "logout") {
    window.localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event("waterserve:storage-change"));
    return { ok: true };
  }

  if (route === "reports" && body === undefined) {
    if (path.includes("?")) fail("Not found.", 404);
    const staff = requireStaff(data);
    return data.reports
      .filter((report) => staff.role === "admin" || report.assigned === staff.id)
      .map((report) => ({ ...report }));
  }

  if (route === "reports" && body !== undefined) {
    const name = requiredText(body.name, "Full name", 2, 100);
    const phone = requiredText(body.phone, "Contact number", 7, 25);
    const address = requiredText(body.address, "Service address", 5, 300);
    const barangay = requiredText(body.barangay, "Barangay", 2, 100);
    const description = requiredText(body.description, "Description", 15, 3000);
    if (!/^[+\d ()-]{7,25}$/.test(phone))
      fail("Enter a valid contact number.");
    if (!ISSUE_TYPES.includes(body.type)) fail("Choose an issue type.");
    if (body.consent !== true)
      fail("Please agree to the use of your details to handle this report.");
    const now = new Date().toISOString();
    const code =
      "WS-" + crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
    const report: IncidentReport = {
      id: crypto.randomUUID(),
      code,
      name,
      phone,
      address,
      barangay,
      description,
      type: body.type,
      account: typeof body.account === "string" ? body.account.slice(0, 50) : "",
      status: "Submitted",
      assigned: null,
      created: now,
      updated: now,
      history: [
        {
          id: crypto.randomUUID(),
          status: "Submitted",
          note: "Your report has been received and is awaiting review.",
          actor: "Resident",
          time: now,
        },
      ],
    };
    data.reports.unshift(report);
    writeData(data);
    return { code };
  }

  if (route === "track")
    return getTrackingResult(data, url.get("code"));

  if (route === "staff") {
    const user = requireStaff(data);
    if (body !== undefined) {
      if (user.role !== "admin")
        fail("Administrator access required.", 403);
      const name = requiredText(body.name, "Name", 2, 100);
      const email = validateEmail(body.email);
      const password = requiredText(body.password, "Password", 12, 128);
      if (!["maintenance", "admin"].includes(body.role))
        fail("Select a role.");
      if (data.staff.some((item) => item.email === email))
        fail("That email already has a staff account.");
      data.staff.push({
        id: crypto.randomUUID(),
        name,
        email,
        role: body.role,
        passwordHash: await passwordHash(password),
      });
      writeData(data);
      return { ok: true };
    }
    return data.staff
      .filter((item) => user.role === "admin" || item.id === user.id)
      .map(publicStaff);
  }

  if (route === "staff-reset-password") {
    const user = requireStaff(data);
    if (user.role !== "admin")
      fail("Administrator access required.", 403);
    const staffId = requiredText(body.staffId, "Staff account", 1, 100);
    const password = requiredText(body.password, "New password", 12, 128);
    const member = data.staff.find(
      (item) => item.id === staffId && item.role === "maintenance",
    );
    if (!member) fail("Maintenance account not found.", 404);
    member.passwordHash = await passwordHash(password);
    writeData(data);
    return { ok: true };
  }

  if (route === "password") {
    const user = requireStaff(data);
    const current = requiredText(body.current, "Current password", 1, 128);
    const password = requiredText(body.password, "New password", 12, 128);
    if (!(await verifyPassword(current, user.passwordHash)))
      fail("Current password is incorrect.");
    user.passwordHash = await passwordHash(password);
    writeData(data);
    window.localStorage.removeItem(SESSION_KEY);
    return { ok: true };
  }

  if (route.startsWith("reports/")) {
    const user = requireStaff(data);
    const report = data.reports.find(
      (item) => item.id === route.slice("reports/".length),
    );
    if (!report) fail("Report not found.", 404);
    let status: string;
    let note: string;
    let assigned = report.assigned;
    if (body.action === "assign") {
      if (user.role !== "admin")
        fail("Administrator access required.", 403);
      if (!["Submitted", "Assigned"].includes(report.status))
        fail("Work has already started.");
      const maintenance = data.staff.find(
        (item) =>
          item.id === body.staffId && item.role === "maintenance",
      );
      if (!maintenance) fail("Select a maintenance staff member.");
      assigned = maintenance.id;
      status = "Assigned";
      note = "A maintenance worker has been assigned to your report.";
    } else {
      if (user.role !== "admin" && report.assigned !== user.id)
        fail("This job is not assigned to you.", 403);
      if (body.action === "start" && report.status === "Assigned") {
        status = "In Progress";
        note = "The maintenance team has started work on this incident.";
      } else if (body.action === "resolve" && report.status === "In Progress") {
        status = "Resolved";
        note = requiredText(body.notes, "Repair notes", 10, 2000);
      } else {
        fail("This action is not available for the current status.", 409);
      }
    }
    report.assigned = assigned;
    addHistory(report, status, note, user.name);
    writeData(data);
    return { ok: true };
  }

  fail("Not found.", 404);
}
