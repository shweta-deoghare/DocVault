import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import { isAuth } from "../middleware/auth.js";
import Document from "../models/Document.js";
import { minioClient } from "../config/minio.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { transporter } from "../utils/mailer.js";
dotenv.config();

const BUCKET = process.env.MINIO_BUCKET; // make sure this exists in your .env

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });



/* ================= VAULT MIDDLEWARE ================= */
const checkVaultAccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (!user.vaultLocked) return next();

    const vaultKey = req.headers.vaultkey;
    console.log("Header Key:", vaultKey, "Stored Hash:", user.vaultKey);

    if (!vaultKey) return res.status(403).json({ message: "Vault is locked. Enter encryption key." });

    const valid = await bcrypt.compare(vaultKey, user.vaultKey);
    if (!valid) return res.status(403).json({ message: "Invalid encryption key" });

    next();
  } catch (err) {
    console.error("Vault access error:", err);
    res.status(500).json({ message: "Vault access check failed", error: err.message });
  }
};

/* ================= VAULT ROUTES ================= */
router.get("/vault-status", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ isLocked: user?.vaultLocked || false, hasKey: !!user?.vaultKey });
  } catch (err) {
    console.error("Vault status error:", err);
    res.status(500).json({ message: "Failed to fetch vault status", error: err.message });
  }
});

router.post("/vault/create-key", isAuth, async (req, res) => {
  try {
    const { key } = req.body;
    if (!key || key.length < 6) return res.status(400).json({ message: "Key must be at least 6 characters" });

    const user = await User.findById(req.userId);
    if (user.vaultKey) return res.status(400).json({ message: "Encryption key already exists" });

    user.vaultKey = await bcrypt.hash(key, 10);
    user.vaultLocked = false;
    await user.save();

    res.json({ message: "Encryption key created successfully" });
  } catch (err) {
    console.error("Create key error:", err);
    res.status(500).json({ message: "Failed to create key", error: err.message });
  }
});

router.post("/vault/lock", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.vaultKey) return res.status(400).json({ message: "Create encryption key first" });

    user.vaultLocked = true;
    await user.save();
    res.json({ message: "Vault locked successfully" });
  } catch (err) {
    console.error("Lock vault error:", err);
    res.status(500).json({ message: "Failed to lock vault", error: err.message });
  }
});

router.post("/vault/unlock", isAuth, async (req, res) => {
  try {
    const { key } = req.body;
    const user = await User.findById(req.userId);

    if (!user.vaultKey) return res.status(400).json({ message: "No encryption key found" });

    const valid = await bcrypt.compare(key, user.vaultKey);
    if (!valid) return res.status(403).json({ message: "Invalid encryption key" });

    user.vaultLocked = false;
    await user.save();
    res.json({ message: "Vault unlocked successfully" });
  } catch (err) {
    console.error("Unlock vault error:", err);
    res.status(500).json({ message: "Failed to unlock vault", error: err.message });
  }
});

/* ================= PERMISSION CHECK ================= */
const hasPermission = (doc, userId, userRole, action) => {
  if (userRole === "admin") return true;
  if (doc.userId?.toString() === userId.toString()) return true;

  const assigned = doc.assignedTo?.find(a => {
    const id = a.userId?._id ? a.userId._id.toString() : a.userId.toString();
    return id === userId.toString();
  });

  return assigned?.permissions?.[action] === true;
};

/* ================= DOCUMENT ROUTES ================= */

// GET DOCUMENTS
router.get("/", isAuth, async (req, res) => {
  try {
    const { categoryId, search, fileType, userId } = req.query;
    let filter = {};
    if (req.userRole === "user") filter.userId = req.userId;
    if (req.userRole === "admin" && userId) filter.userId = userId;
    if (categoryId) filter.categoryId = categoryId;
    if (fileType) filter.mimetype = fileType;
    if (search) filter.filename = { $regex: search, $options: "i" };

    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .populate("categoryId", "name")
      .populate("userId", "firstname lastname email")
      .populate("assignedTo.userId", "firstname lastname email");

    res.json(documents);
  } catch (err) {
    console.error("GET DOCUMENTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch documents", error: err.message });
  }
});

// UPLOAD DOCUMENT
router.post("/upload", isAuth, checkVaultAccess, upload.single("file"), async (req, res) => {
  try {
    const { categoryId } = req.body;
    const file = req.file;
    if (!file || !categoryId) return res.status(400).json({ message: "File and category required" });

    const objectName = `${Date.now()}-${file.originalname}`;
    await minioClient.putObject(BUCKET, objectName, file.buffer);

    const document = await Document.create({
      filename: file.originalname,
      mimetype: file.mimetype,
      minioPath: objectName,
      categoryId,
      userId: req.userId,
      assignedTo: [],
    });

    res.status(201).json(document);
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// VIEW DOCUMENT
router.get("/:id/view", isAuth, checkVaultAccess, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    if (!hasPermission(doc, req.userId, req.userRole, "view"))
      return res.status(403).json({ message: "Permission denied" });

    const stream = await minioClient.getObject(BUCKET, doc.minioPath);
    res.setHeader("Content-Type", doc.mimetype);
    stream.pipe(res);
  } catch (err) {
    console.error("VIEW ERROR:", err);
    res.status(500).json({ message: "Failed to view document", error: err.message });
  }
});

// DOWNLOAD DOCUMENT
router.get("/:id/download", isAuth, checkVaultAccess, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    if (!hasPermission(doc, req.userId, req.userRole, "download"))
      return res.status(403).json({ message: "Permission denied" });

    const stream = await minioClient.getObject(BUCKET, doc.minioPath);
    res.setHeader("Content-Type", doc.mimetype);
    res.setHeader("Content-Disposition", `attachment; filename="${doc.filename}"`);
    stream.pipe(res);
  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
    res.status(500).json({ message: "Failed to download document", error: err.message });
  }
});

// REPLACE DOCUMENT
router.put("/:id/replace", isAuth, checkVaultAccess, upload.single("file"), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    if (!hasPermission(doc, req.userId, req.userRole, "update"))
      return res.status(403).json({ message: "Permission denied" });

    const file = req.file;
    if (!file) return res.status(400).json({ message: "File required" });

    const objectName = `${Date.now()}-${file.originalname}`;
    await minioClient.putObject(BUCKET, objectName, file.buffer);

    doc.history.push({
      filename: doc.filename,
      minioPath: doc.minioPath,
      mimetype: doc.mimetype,
      replacedAt: new Date(),
    });

    doc.filename = file.originalname;
    doc.minioPath = objectName;
    doc.mimetype = file.mimetype;

    await doc.save();
    res.json({ message: "Document replaced successfully" });
  } catch (err) {
    console.error("REPLACE ERROR:", err);
    res.status(500).json({ message: "Replace failed", error: err.message });
  }
});

// HISTORY VIEW/DOWNLOAD
router.get("/:id/history/:index/view", isAuth, checkVaultAccess, async (req, res) => {
  try {
    const { id, index } = req.params;
    const doc = await Document.findById(id);
    if (!doc || !doc.history[index]) return res.status(404).json({ message: "History not found" });

    const item = doc.history[index];
    const stream = await minioClient.getObject(BUCKET, item.minioPath);
    res.setHeader("Content-Type", item.mimetype);
    stream.pipe(res);
  } catch (err) {
    console.error("HISTORY VIEW ERROR:", err);
    res.status(500).json({ message: "Failed to view history", error: err.message });
  }
});

router.get("/:id/history/:index/download", isAuth, checkVaultAccess, async (req, res) => {
  try {
    const { id, index } = req.params;
    const doc = await Document.findById(id);
    if (!doc || !doc.history[index]) return res.status(404).json({ message: "History not found" });

    const item = doc.history[index];
    const stream = await minioClient.getObject(BUCKET, item.minioPath);
    res.setHeader("Content-Type", item.mimetype);
    res.setHeader("Content-Disposition", `attachment; filename="${item.filename}"`);
    stream.pipe(res);
  } catch (err) {
    console.error("HISTORY DOWNLOAD ERROR:", err);
    res.status(500).json({ message: "Failed to download history", error: err.message });
  }
});
router.delete("/bulk-delete", isAuth, checkVaultAccess, async (req, res) => {
  try {
    const { documentIds } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ message: "No documents selected" });
    }

    const userId = req.userId;
    const role = req.userRole;

    const documents = await Document.find({ _id: { $in: documentIds } });

    if (!documents.length) {
      return res.status(404).json({ message: "Documents not found" });
    }

    // Permission check
    for (const doc of documents) {
      if (role !== "admin" && doc.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          message: "You can delete only your own documents",
        });
      }
    }

    // MinIO delete (SAFE)
    for (const doc of documents) {
      if (doc.minioPath && BUCKET) {
        try {
          await minioClient.removeObject(BUCKET, doc.minioPath);
        } catch (err) {
          console.error("MINIO DELETE ERROR:", err.message);
          // DO NOT THROW — continue deleting DB record
        }
      }
    }

    // Mongo delete
    await Document.deleteMany({ _id: { $in: documentIds } });

    res.json({
      message: "Documents deleted successfully",
      deletedCount: documents.length,
    });

  } catch (err) {
    console.error("BULK DELETE ERROR:", err);
    res.status(500).json({
      message: "Failed to delete documents",
      error: err.message,
    });
  }
});




// DELETE DOCUMENT
router.delete("/:id", isAuth, checkVaultAccess, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    if (req.userRole !== "admin" && doc.userId.toString() !== req.userId)
      return res.status(403).json({ message: "Access denied" });

    if (doc.minioPath) await minioClient.removeObject(BUCKET, doc.minioPath);
    await Document.deleteOne({ _id: doc._id });

    res.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete document", error: err.message });
  }
});

// BULK DELETE

// =================== GET ALL DOCUMENTS ===================
// ==============
// =================== GET ASSIGNED DOCUMENTS ===================
// =================== GET ASSIGNED DOCUMENTS ===================
router.get("/assigned", isAuth, async (req, res) => {
  try {
    const { userId } = req.query; // selected user in admin panel

    if (!userId && req.userRole !== "user") {
      return res.status(400).json({ message: "userId is required for admin" });
    }

    // For normal users, fetch their own assigned docs
    const targetUserId = req.userRole === "user" ? req.userId : userId;

    // Find documents where the target user is in the assignedTo array
    const documents = await Document.find({ "assignedTo.userId": targetUserId })
      .sort({ createdAt: -1 })
      .populate("categoryId", "name")
      .populate("userId", "firstname lastname email")
      .populate("assignedTo.userId", "firstname lastname email");

    // Filter assignedTo array to only include the target user
    const filteredDocs = documents.map((doc) => {
      const assignedEntry = doc.assignedTo.find(
        (a) => a.userId._id.toString() === targetUserId
      );
      return {
        _id: doc._id,
        filename: doc.filename,
        mimetype: doc.mimetype,
        categoryId: doc.categoryId,
        userId: doc.userId,
        permissions: assignedEntry ? assignedEntry.permissions : {},
      };
    });

    console.log("ASSIGNED DOCS FOR USER:", filteredDocs);
    res.json(filteredDocs);
  } catch (err) {
    console.error("ASSIGNED DOCS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch assigned documents" });
  }
});
// ✅ ADMIN: fetch assigned docs for ANY user
// GET assigned documents for a specific user (ADMIN VIEW)
// GET assigned docs for a particular user (ADMIN)
// GET assigned docs for a particular user (ADMIN)
router.get("/assigned/by-user/:userId", isAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const docs = await Document.find({
      "assignedTo.userId": userId,
    })
      .populate("categoryId")
      .populate("userId")
      .lean();

    // 🔥 KEEP ONLY THIS USER IN assignedTo
    const filteredDocs = docs.map(doc => ({
      ...doc,
      assignedTo: doc.assignedTo.filter(
        a => String(a.userId) === String(userId)
      )
    }));

    res.json(filteredDocs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch assigned docs" });
  }
});
router.delete("/history/:docId/:index", async (req, res) => {
  try {
    const { docId, index } = req.params;

    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    doc.history.splice(index, 1);
    await doc.save();

    res.json({ message: "History deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});
router.get("/history/:id", async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    res.json(doc.history);
  } catch {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});
// GET documents assigned to a specific user
router.get("/assigned/:userId", isAuth, async (req, res) => {
  const { userId } = req.params;

  const docs = await Document.find({
    "assignedTo.userId": userId
  })
    .populate("categoryId")
    .populate("userId");

  res.json(docs);
});
// =================== VIEW DOCUMENT ===================

// =================== REPLACE DOCUMENT ===================
// =================== REPLACE DOCUMENT ===================
// REPLACE DOCUMENT

// VIEW HISTORY ITEM
// =================== ASSIGN DOCUMENT ===================
// =================== ASSIGN DOCUMENT ===================
// =================== ASSIGN DOCUMENT ===================
router.post("/:id/assign", isAuth, async (req, res) => {
  try {
    console.log("📥 BODY RECEIVED:", req.body);

    const { assignments, sendEmail } = req.body;

    console.log("📧 sendEmail:", sendEmail);

    // ✅ Validate payload
    if (!Array.isArray(assignments)) {
      return res.status(400).json({ message: "Invalid assignments payload" });
    }

    // ✅ Only admin can assign
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Only admin can assign documents" });
    }

    // ✅ Find document
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // ✅ Filter valid assignments
    const validAssignments = assignments.filter(
      (a) =>
        mongoose.Types.ObjectId.isValid(a.userId) &&
        a.permissions &&
        (a.permissions.view || a.permissions.download || a.permissions.update)
    );

    console.log("✅ Valid Assignments:", validAssignments.length);

    // ✅ Save assignments
    doc.assignedTo = validAssignments.map((a) => ({
      userId: new mongoose.Types.ObjectId(a.userId),
      permissions: {
        view: !!a.permissions.view,
        download: !!a.permissions.download,
        update: !!a.permissions.update,
      },
      assignedAt: new Date(),
    }));

    await doc.save();

    console.log("💾 Document saved successfully");

    // ================= EMAIL NOTIFICATION =================
    if (sendEmail && validAssignments.length > 0) {
      console.log("📨 Sending Emails...");

      for (const a of validAssignments) {
        try {
          const user = await User.findById(a.userId);

          console.log("👤 User found:", user?.email);

          if (!user || !user.email) {
            console.log("⚠️ Skipping user (no email)");
            continue;
          }

          const permissions = [];
          if (a.permissions.view) permissions.push("View");
          if (a.permissions.download) permissions.push("Download");
          if (a.permissions.update) permissions.push("Update");

          const info = await transporter.sendMail({
            from: `"DocVault" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "📄 New Document Assigned",
            html: `
              <div style="font-family: Arial, sans-serif; padding: 10px;">
                <h2 style="color:#4f46e5;">📄 Document Assigned</h2>

                <p>Hello <b>${user.firstname || "User"}</b>,</p>

                <p>A new document has been assigned to you.</p>

                <p><b>Document Name:</b> ${doc.filename}</p>

                <p><b>Permissions:</b></p>
                <ul>
                  ${permissions.map(p => `<li>${p}</li>`).join("")}
                </ul>

                <br/>

                
                <br/><br/>

                <p style="color:gray; font-size:12px;">
                  This is an automated message from DocVault.
                </p>
              </div>
            `,
          });

          console.log("✅ Email sent:", info.response);

        } catch (err) {
          console.error("❌ Email failed for user:", a.userId);
          console.error("❌ Error:", err.message);
        }
      }
    } else {
      console.log("⛔ Email skipped (checkbox not checked)");
    }

    // ================= NOTIFICATIONS =================
    await Notification.deleteMany({ documentId: doc._id });

    if (validAssignments.length > 0) {
      const notifications = validAssignments.map((a) => ({
        userId: a.userId,
        documentId: doc._id,
        senderRole: req.userRole,
        message: `A new document "${doc.filename}" has been assigned to you.`,
        link: "/assigned-documents",
        read: false,
      }));

      await Notification.insertMany(notifications);
    }

    res.json({ message: "Document assigned successfully" });

  } catch (err) {
    console.error("❌ ASSIGN ERROR FULL:", err);
    res.status(500).json({ message: "Assignment failed" });
  }
});
// =================== GET SINGLE DOCUMENT ===================
router.get("/:id", isAuth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate("assignedTo.userId", "firstname lastname email")
      .populate("userId", "firstname lastname email")
      .populate("categoryId", "name")
      .lean();

    if (!doc) return res.status(404).json({ message: "Document not found" });

    doc.assignedTo = doc.assignedTo.map(a => ({
      userId: a.userId?._id?.toString(),
      user: a.userId,
      permissions: {
        view: !!a.permissions?.view,
        download: !!a.permissions?.download,
        update: !!a.permissions?.update,
      },
    }));

    res.json(doc);
  } catch (err) {
    console.error("GET DOC ERROR:", err);
    res.status(500).json({ message: "Failed to fetch document" });
  }
});



export default router;