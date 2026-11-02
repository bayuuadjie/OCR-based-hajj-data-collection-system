import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME, type SessionPayload } from "@/lib/session";
import { pool } from "@/server/db";

/** Kembalikan payload session kalau valid, atau null kalau tidak ada/kedaluwarsa. */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  let payload: SessionPayload;
  try {
    payload = await verifySessionToken(token);
  } catch {
    return null;
  }

  const result = await pool.query(
    `SELECT is_active FROM operators
     WHERE id = $1 AND active_session_id = $2 AND active_session_expires_at > now()`,
    [payload.sub, payload.sid]
  );
  return result.rows[0]?.is_active ? payload : null;
}