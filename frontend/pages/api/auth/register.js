import bcrypt from "bcryptjs";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import { createSessionToken, setSessionCookie, sanitizeUser } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "user",
      walletAddress: "",
      kycStatus: "none",
    });

    const token = createSessionToken(user);
    setSessionCookie(res, token);

    return res.status(201).json({
      message: "Registration successful",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      message: "Failed to register user",
    });
  }
}