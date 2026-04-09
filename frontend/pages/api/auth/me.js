import { getAuthenticatedUser } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        message: "Not authenticated",
        user: null,
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      message: "Failed to fetch current user",
    });
  }
}