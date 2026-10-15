import { createHash, createHmac, timingSafeEqual } from "crypto";

export const COOKIE = "at_desk";

const SESSION_MS = 1000 * 60 * 60 * 12;

function sessionSecret() {
  return process.env.ADMIN_SECRET || "andhra-thota-local-session";
}

export function expectedPassword() {
  return process.env.ADMIN_PASSWORD || "rythu-thota";
}

export function usingDefaultPassword() {
  return !process.env.ADMIN_PASSWORD;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function passwordMatches(input: string) {
  const actual = digest(input);
  const expected = digest(expectedPassword());
  return timingSafeEqual(actual, expected);
}

export function signSession() {
  const exp = Date.now() + SESSION_MS;
  const body = String(exp);
  const sig = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined) {
  if (!token) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length) return false;
  if (!timingSafeEqual(actualBuf, expectedBuf)) return false;
  const exp = Number(body);
  return Number.isFinite(exp) && exp > Date.now();
}
