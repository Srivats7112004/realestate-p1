import jwt from "jsonwebtoken";
import { parse, serialize } from "cookie";
import connectDB from "./db";
import User from "../models/User";

export const SESSION_COOKIE_NAME = "be_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getJwtSecret() {
  return process.env.AUTH_JWT_SECRET || "dev_secret_change_me";
}

export function sanitizeUser(user) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    walletAddress: user.walletAddress || "",
    kycStatus: user.kycStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function createSessionToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: SESSION_MAX_AGE,
    }
  );
}

export function setSessionCookie(res, token) {
  const cookie = serialize(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  res.setHeader("Set-Cookie", cookie);
}

export function clearSessionCookie(res) {
  const cookie = serialize(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.setHeader("Set-Cookie", cookie);
}

export function getTokenFromRequest(req) {
  const cookies = parse(req.headers.cookie || "");
  return cookies[SESSION_COOKIE_NAME] || null;
}

export function verifySessionToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload?.sub) return null;

  await connectDB();
  const user = await User.findById(payload.sub);

  return sanitizeUser(user);
}

export async function requireAuth(req, res) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }

  return user;
}