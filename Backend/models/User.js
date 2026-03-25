import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },

    
    vaultLocked: {
      type: Boolean,
      default: false,
    },
    vaultKey: {
      type: String, 
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);