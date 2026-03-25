import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // <-- keep this
import notificationsRoutes from "./routes/Notification.js";
import masterSheetRoutes from "./routes/masterSheet.js"; // Master Sheet users
import annexure1Routes from "./routes/annexure1Routes.js";
import annexure2Routes from "./routes/annexure2Routes.js";
// import vaultRoutes from "./routes/vaultRoutes.js";

import Category from "./models/Category.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// ------------------ ROUTES ------------------
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/users", userRoutes);          // <-- needed for login/admin users
app.use("/api/notifications", notificationsRoutes);
app.use("/api/master-sheet", masterSheetRoutes); // Master Sheet users
app.use("/api/annexure1",annexure1Routes);
app.use("/api/annexure2",annexure2Routes);
// app.use("/api",vaultRoutes);

// optional legacy route
app.use("/documents", documentRoutes);

// ------------------ START SERVER ------------------
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Default categories
    const ADMIN_ID = new mongoose.Types.ObjectId("000000000000000000000001");
    const defaults = ["Business", "Personal", "Financial", "Academic"];

    for (const name of defaults) {
      const exists = await Category.findOne({ name });
      if (!exists) {
        await Category.create({
          name,
          createdBy: ADMIN_ID,
          createdByRole: "admin",
        });
        console.log(`Default category created: ${name}`);
      }
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Server start error:", err);
  }
};

startServer();