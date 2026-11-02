import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "session";
export const SESSION_IDLE_TIMEOUT_MINUTES = 10;
const secretEnv = process.env.SESSION_SECRET;

if (!secretEnv && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET belum di-set di environment variable.");
}

const secret = new TextEncoder().encode(secretEnv ?? "dev-only-insecure-secret-change-me");

export type SessionPayload = {
  sub: string;
  sid: string;
  username: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_IDLE_TIMEOUT_MINUTES}m`)
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  if (
    typeof payload.sub !== "string" ||
    typeof payload.sid !== "string" ||
    typeof payload.username !== "string" ||
    typeof payload.name !== "string" ||
    (payload.role !== "ADMIN" && payload.role !== "OPERATOR")
  ) {
    throw new Error("Payload sesi tidak valid.");
  }
  return payload as SessionPayload;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
