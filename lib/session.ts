import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "session";
const secretEnv = process.env.SESSION_SECRET;

if (!secretEnv && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET belum di-set di environment variable.");
}

const secret = new TextEncoder().encode(secretEnv ?? "dev-only-insecure-secret-change-me");

export type SessionPayload = {
  sub: string;
  username: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify<SessionPayload>(token, secret);
  return payload;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
