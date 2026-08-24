import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/constants";

const COOKIE_NAME = "bermakna_session";
const SESSION_DAYS = 30;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error(
      "SESSION_SECRET belum diisi. Salin .env.example menjadi .env terlebih dahulu.",
    );
  }
  return value;
}

// ── Kata sandi (scrypt bawaan Node — tanpa dependensi native) ────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, digest] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !digest) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

// ── Cookie sesi bertanda tangan HMAC ─────────────────────────────────────

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encodeToken(userId: string, expiresAt: number): string {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt })).toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
}

function decodeToken(token: string): { userId: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.userId !== "string") return null;
    if (typeof data.expiresAt !== "number" || Date.now() > data.expiresAt) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const store = await cookies();
  store.set(COOKIE_NAME, encodeToken(userId, expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// ── Pembacaan sesi ───────────────────────────────────────────────────────

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  campus: string;
  faculty: string | null;
  batch: string | null;
  avatarUrl: string | null;
  provider: {
    id: string;
    status: string;
    headline: string;
    isPremium: boolean;
  } | null;
};

/**
 * Dibungkus `cache()` agar satu request hanya sekali menembak database
 * walaupun dipanggil di banyak komponen server.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      campus: true,
      faculty: true,
      batch: true,
      avatarUrl: true,
      isActive: true,
      provider: {
        select: { id: true, status: true, headline: true, isPremium: true },
      },
    },
  });

  if (!user || !user.isActive) return null;
  const { isActive: _isActive, ...rest } = user;
  return rest;
});

// ── Penjaga akses ────────────────────────────────────────────────────────

export async function requireUser(redirectTo = "/masuk"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) redirect("/dashboard");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(ROLES.ADMIN);
}

/** Penyedia yang sudah lolos verifikasi admin. */
export async function requireVerifiedProvider(): Promise<
  SessionUser & { provider: NonNullable<SessionUser["provider"]> }
> {
  const user = await requireUser();
  if (!user.provider) redirect("/jadi-penyedia");
  if (user.provider.status !== "VERIFIED") redirect("/mitra/status");
  return user as SessionUser & { provider: NonNullable<SessionUser["provider"]> };
}

/** Penyedia terdaftar, apa pun status verifikasinya. */
export async function requireProvider(): Promise<
  SessionUser & { provider: NonNullable<SessionUser["provider"]> }
> {
  const user = await requireUser();
  if (!user.provider) redirect("/jadi-penyedia");
  return user as SessionUser & { provider: NonNullable<SessionUser["provider"]> };
}
