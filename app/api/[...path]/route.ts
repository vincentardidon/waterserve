import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "../../../lib/supabase/server";
import { ISSUE_TYPES } from "../../../lib/constants";

type Profile = { id: string; full_name: string; email: string; role: "admin" | "maintenance" | "customer" };
const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

function requiredText(value: unknown, name: string, min: number, max: number) {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max)
    throw new Error(`${name} must be between ${min} and ${max} characters.`);
  return value.trim();
}

async function getProfile(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data, error: profileError } = await supabase.from("profiles").select("id,full_name,email,role").eq("id", user.id).single();
  if (profileError || !data) return null;
  return data as Profile;
}

function toIncident(row: any) {
  return {
    id: row.id, code: row.tracking_code, type: row.issue_type, description: row.description,
    barangay: row.barangay, status: row.status, created: row.created_at, updated: row.updated_at,
    name: row.customer_name, phone: row.phone, address: row.address, account: "",
    assigned: row.assigned_to, history: (row.incident_history || []).map((entry: any) => ({
      id: entry.id, status: entry.status, note: entry.note, time: entry.created_at,
      actor: entry.actor_name || "WaterServe staff",
    })),
  };
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const [{ path }, supabase] = await Promise.all([context.params, createSupabaseServerClient()]);
    const [route, ...rest] = path;
    if (route === "session") {
      const user = await getProfile(supabase);
      return json({ user: user ? { id: user.id, name: user.full_name, email: user.email, role: user.role } : null, needsSetup: false });
    }
    if (route === "track") {
      const viewer = await getProfile(supabase);
      if (!viewer) return json({ error: "Please sign in to track reports." }, 401);
      if (viewer.role !== "customer") return json({ error: "Customer account access is required." }, 403);
      const code = request.nextUrl.searchParams.get("code") || "";
      const { data, error } = await supabase.rpc("public_track_report", { p_code: code });
      if (error) return json({ error: error.message }, error.code === "P0002" ? 404 : 400);
      return json(data);
    }
    if (route === "reports") {
      const user = await getProfile(supabase);
      if (!user) return json({ error: "Please sign in to continue." }, 401);
      const { data, error } = await supabase.from("incidents").select("*,incident_history(*)").order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 400);
      return json((data || []).map(toIncident));
    }
    if (route === "staff") {
      const user = await getProfile(supabase);
      if (!user) return json({ error: "Please sign in to continue." }, 401);
      const { data, error } = await supabase.from("profiles").select("id,full_name,email,role").order("full_name");
      if (error) return json({ error: error.message }, 400);
      const visible = user.role === "admin" ? (data || []).filter((item) => item.role !== "customer") : [user];
      return json(visible.map((item) => ({ id: item.id, name: item.full_name, email: item.email, role: item.role })));
    }
    return json({ error: "Not found." }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return json({ error: message }, message.includes("Supabase is not configured") || message.includes("NEXT_PUBLIC_SUPABASE_") ? 503 : 500);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { path } = await context.params;
    const [route, ...rest] = path;
    const body = await request.json().catch(() => ({}));

    if (route === "login") {
      const email = requiredText(body.email, "Email", 5, 150).toLowerCase();
      const password = requiredText(body.password, "Password", 1, 128);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return json({ error: "Email or password is incorrect." }, 401);
      const profile = await getProfile(supabase);
      if (!profile) { await supabase.auth.signOut(); return json({ error: "This account has no WaterServe role. Contact an administrator." }, 403); }
      return json({ ok: true, role: profile.role });
    }
    if (route === "signup") {
      const fullName = requiredText(body.name, "Full name", 2, 100);
      const email = requiredText(body.email, "Email", 5, 150).toLowerCase();
      const password = requiredText(body.password, "Password", 12, 128);
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, confirmationRequired: !data.session });
    }
    if (route === "logout") {
      const { error } = await supabase.auth.signOut();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    if (route === "password-reset") {
      const email = requiredText(body.email, "Email", 5, 150).toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${request.nextUrl.origin}/reset-password` });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    if (route === "new-password") {
      const password = requiredText(body.password, "New password", 12, 128);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return json({ error: "Open the password reset link from your email first." }, 401);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return json({ error: error.message }, 400);
      await supabase.auth.signOut();
      return json({ ok: true });
    }
    if (route === "password") {
      const profile = await getProfile(supabase);
      if (!profile) return json({ error: "Please sign in to continue." }, 401);
      const current = requiredText(body.current, "Current password", 1, 128);
      const password = requiredText(body.password, "New password", 12, 128);
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: profile.email, password: current });
      if (verifyError) return json({ error: "Current password is incorrect." }, 400);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return json({ error: error.message }, 400);
      await supabase.auth.signOut();
      return json({ ok: true });
    }
    if (route === "reports" && rest.length === 0) {
      const customer = await getProfile(supabase);
      if (!customer) return json({ error: "Please sign in to submit a report." }, 401);
      if (customer.role !== "customer") return json({ error: "Customer account access is required to submit a report." }, 403);
      const name = requiredText(body.name, "Full name", 2, 100);
      const phone = requiredText(body.phone, "Contact number", 7, 25);
      const address = requiredText(body.address, "Service address", 5, 300);
      const barangay = requiredText(body.barangay, "Barangay", 2, 100);
      const description = requiredText(body.description, "Description", 15, 3000);
      if (!/^[+\d ()-]{7,25}$/.test(phone)) return json({ error: "Enter a valid contact number." }, 400);
      if (!ISSUE_TYPES.includes(body.type)) return json({ error: "Choose an issue type." }, 400);
      if (body.consent !== true) return json({ error: "Please agree to the use of your details to handle this report." }, 400);
      const { data, error } = await supabase.rpc("create_incident", {
        p_customer_name: name, p_phone: phone, p_address: address, p_barangay: barangay,
        p_description: description, p_issue_type: body.type, p_consent: true,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ code: data });
    }
    if (route === "staff" && rest.length === 0) {
      const actor = await getProfile(supabase);
      if (!actor) return json({ error: "Please sign in to continue." }, 401);
      if (actor.role !== "admin") return json({ error: "Administrator access required." }, 403);
      const name = requiredText(body.name, "Name", 2, 100);
      const email = requiredText(body.email, "Email", 5, 150).toLowerCase();
      const password = requiredText(body.password, "Password", 12, 128);
      if (body.role !== "maintenance") return json({ error: "Only maintenance accounts can be created here." }, 400);
      const admin = await createSupabaseAdminClient();
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
      if (error || !data.user) return json({ error: error?.message || "Could not create account." }, 400);
      const { error: updateError } = await admin.from("profiles").update({ role: "maintenance", full_name: name }).eq("id", data.user.id);
      if (updateError) { await admin.auth.admin.deleteUser(data.user.id); return json({ error: updateError.message }, 400); }
      return json({ ok: true });
    }
    if (route === "staff-reset-password") {
      const actor = await getProfile(supabase);
      if (!actor) return json({ error: "Please sign in to continue." }, 401);
      if (actor.role !== "admin") return json({ error: "Administrator access required." }, 403);
      const staffId = requiredText(body.staffId, "Staff account", 1, 100);
      const password = requiredText(body.password, "New password", 12, 128);
      const admin = await createSupabaseAdminClient();
      const { data: target } = await admin.from("profiles").select("id").eq("id", staffId).eq("role", "maintenance").maybeSingle();
      if (!target) return json({ error: "Maintenance account not found." }, 404);
      const { error } = await admin.auth.admin.updateUserById(staffId, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    if (route === "reports" && rest.length === 1) {
      const actor = await getProfile(supabase);
      if (!actor) return json({ error: "Please sign in to continue." }, 401);
      const { error } = await supabase.rpc("update_incident", {
        p_incident_id: rest[0], p_action: body.action, p_staff_id: body.staffId || null, p_notes: body.notes || null,
      });
      if (error) return json({ error: error.message }, error.code === "42501" ? 403 : 400);
      return json({ ok: true });
    }
    return json({ error: "Not found." }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return json({ error: message }, message.includes("Supabase is not configured") || message.includes("NEXT_PUBLIC_SUPABASE_") ? 503 : 400);
  }
}
