import connectDB from "../../../lib/db";
import User from "../../../models/User";
import { requireAuth, sanitizeUser } from "../../../lib/auth";

const ALLOWED_ROLES = ["user", "inspector", "government", "lender", "admin"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "Dev role switching is disabled in production." });
  }

  try {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;

    const { role } = req.body || {};

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      currentUser.id,
      { role },
      { new: true }
    );

    return res.status(200).json({
      message: "Role updated successfully",
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.error("Dev set role error:", error);
    return res.status(500).json({ message: "Failed to update role" });
  }
}