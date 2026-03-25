import API from "../api/API";
import { useAuth } from "../context/AuthContext";

// This is a reusable hook-like function
export const fetchAssignedDocs = async (userId) => {
  try {
    const res = await API.get("/documents"); // backend filters sharedWith already
    // Filter only assigned docs for this user
    const assigned = res.data.filter((doc) =>
      doc.sharedWith?.some(
        (s) =>
          s.userId &&
          (s.userId._id === userId || s.userId === userId)
      )
    );
    return assigned;
  } catch (err) {
    console.error("Failed to fetch assigned docs:", err);
    return [];
  }
};
console.log("📄 DOCUMENT FROM API:", document);
console.log("👥 SHARED WITH:", document.sharedWith);