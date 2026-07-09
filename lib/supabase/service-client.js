// Server-side Supabase access using the service_role key (bypasses RLS).
// Only ever import this from api/ functions — never expose this key to the client.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pzrjboiioplhijzyfdmf.supabase.co';

function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return key;
}

async function supabaseRequest(endpoint, options = {}) {
  const key = getServiceRoleKey();
  const res = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  // PostgREST returns an empty body for POST/PATCH without `Prefer: return=representation`
  // (as plain 201/200, not just 204) — parse only if there's actually content.
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

module.exports = { supabaseRequest };
