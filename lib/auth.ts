import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "rsd_admin";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is missing");
  return value;
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSessionValue() {
  const value = `${Date.now()}.${crypto.randomBytes(24).toString("hex")}`;
  return `${value}.${sign(value)}`;
}

export function validSession(value: string | undefined) {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [timestamp, nonce, signature] = parts;
  const raw = `${timestamp}.${nonce}`;
  const expected = sign(raw);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  return Date.now() - Number(timestamp) < 1000 * 60 * 60 * 24 * 7;
}

export async function isAdmin() {
  return validSession((await cookies()).get(COOKIE)?.value);
}

export const sessionCookie = COOKIE;
