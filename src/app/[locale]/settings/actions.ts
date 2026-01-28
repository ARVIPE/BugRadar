"use server";

import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Search Supabase Auth user by email (Admin API).
 */
async function getAuthUserByEmail(email: string) {
  const sb = supabaseServer();
  // Paginate just in case (simple, 1..5 pages)
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 1000) break;
  }
  return null;
}

/**
 * Get notify_email from user_metadata.notify_email (Admin API).
 */
export async function getNotifyEmailFor(email: string) {
  const sbUser = await getAuthUserByEmail(email);
  if (!sbUser) return email;
  const meta = (sbUser.user_metadata || {}) as Record<string, unknown>;
  return (meta.notify_email as string) || email;
}

/**
 * Save notify_email to user_metadata.notify_email (Admin API).
 */
export async function setNotifyEmailFor(email: string, notifyEmail: string) {
  const sb = supabaseServer();
  const sbUser = await getAuthUserByEmail(email);
  if (!sbUser) throw new Error("Supabase user not found for " + email);

  const newMeta = {
    ...(sbUser.user_metadata || {}),
    notify_email: notifyEmail,
  };

  const { error } = await sb.auth.admin.updateUserById(sbUser.id, {
    user_metadata: newMeta,
  });
  if (error) throw error;

  return { ok: true };
}
