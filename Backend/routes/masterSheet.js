import express from "express";
import MasterSheet from "../models/User2.js"; // your model

const router = express.Router();

/* ---------------- Bulk Create ---------------- */
router.post("/bulk-create", async (req, res) => {
  try {
    const clients = req.body;

    if (!Array.isArray(clients)) {
      return res.status(400).json({ message: "Invalid format" });
    }

    const formattedClients = clients.map((client) => {
      const { companyName, email, contactNumber, ...rest } = client;

      return {
        companyName,
        email,
        contactNumber,
        masterSheetData: rest, // ✅ everything else goes here
      };
    });

    await MasterSheet.insertMany(formattedClients);

    res.json({
      message: `${clients.length} clients created successfully`,
    });
  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- Get All Users ---------------- */
router.get("/", async (req, res) => {
  try {
    const users = await MasterSheet.find().sort({ createdAt: -1 });  // ✅ FIXED
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* ---------------- Update User ---------------- */
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, email, contactNumber, ...rest } = req.body;

    const updatedUser = await MasterSheet.findByIdAndUpdate(
      id,
      {
        companyName,
        email,
        contactNumber,
        masterSheetData: rest, // ✅ clean structure
      },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user" });
  }
});
/* ---------------- Delete User ---------------- */
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await MasterSheet.findByIdAndDelete(id); // ✅ FIXED

    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

/* ---------------- Get Single User ---------------- */
router.get("/:id", async (req, res) => {
  try {
    const user = await MasterSheet.findById(req.params.id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json(user); // ✅ send full user
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

export default router;