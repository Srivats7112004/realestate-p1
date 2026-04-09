import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "inspector", "government", "lender", "admin"],
      default: "user",
    },
    walletAddress: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    kycStatus: {
      type: String,
      enum: ["none", "pending", "verified", "rejected"],
      default: "none",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);