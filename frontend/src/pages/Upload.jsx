import { useEffect, useState } from "react";
import API from "../api/API";
import DashboardLayout from "../Layouts/DashboardLayout";

const Upload = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [vaultLocked, setVaultLocked] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("");

  /* ================= FETCH CATEGORIES ================= */
  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      setCategories(res.data);
      if (res.data.length > 0) {
        setSelectedCategory(res.data[0]._id);
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
  };

  /* ================= FETCH VAULT STATUS ================= */
  const fetchVaultStatus = async () => {
    try {
      const res = await API.get("/documents/vault-status");
      setVaultLocked(res.data.isLocked);
    } catch (err) {
      console.error("Vault status error:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchVaultStatus();
  }, []);

  /* ================= ACTUAL UPLOAD FUNCTION ================= */
  const uploadDocument = async (key = null) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("categoryId", selectedCategory);

    if (key) {
      return await API.post("/documents/upload", formData, {
        headers: {
          vaultkey: key,   // ✅ IMPORTANT FIX
        },
      });
    } else {
      return await API.post("/documents/upload", formData);
    }
  };

  /* ================= HANDLE UPLOAD ================= */
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file || !selectedCategory) {
      alert("Please select category and file");
      return;
    }

    try {
      setLoading(true);

      if (vaultLocked) {
        setShowKeyModal(true);
        setLoading(false);
        return;
      }

      await uploadDocument();
      alert("Document uploaded successfully ✅");
      setFile(null);
    } catch (err) {
      alert(
        err.response?.data?.message || "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= SUBMIT KEY AND RETRY ================= */
  const handleKeySubmit = async () => {
    if (!encryptionKey) {
      alert("Enter encryption key");
      return;
    }

    try {
      setLoading(true);

      await uploadDocument(encryptionKey);

      alert("Document uploaded successfully 🔐");
      setFile(null);
      setShowKeyModal(false);
      setEncryptionKey("");

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Invalid encryption key"
      );
    } finally {
      setLoading(false);
    }
  };

 return (
  <DashboardLayout>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 rounded-3xl">

      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
          Upload Document
        </h2>
        <p className="text-gray-500 mt-1">
          Securely upload documents to your vault
        </p>
      </div>

      {/* UPLOAD CARD */}
      <form
        onSubmit={handleUpload}
        className="bg-white/80 backdrop-blur-lg p-10 rounded-3xl shadow-lg border border-blue-100 max-w-2xl"
      >
        <div className="flex flex-col gap-6">

          {/* CATEGORY */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Select Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 bg-white/80 outline-none focus:ring-2 focus:ring-indigo-300"
              required
            >
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* FILE INPUT (PREMIUM STYLE) */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Choose File
            </label>

            <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-indigo-300 rounded-2xl bg-white hover:bg-indigo-50 transition cursor-pointer">
              <span className="text-gray-500 text-sm">
                Click to upload or drag & drop
              </span>
              <span className="text-xs text-gray-400 mt-1">
                PDF, DOC, Images supported
              </span>

              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                required
              />
            </label>

            {file && (
              <p className="text-sm text-indigo-600 mt-2">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* VAULT STATUS */}
          <div
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              vaultLocked
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {vaultLocked ? "Vault is Locked 🔒" : "Vault is Unlocked 🔓"}
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      </form>

      {/* ================= MODAL ================= */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl w-96 shadow-2xl border border-white/40">

            <h3 className="font-semibold mb-4 text-xl text-gray-800">
              🔐 Vault Locked
            </h3>

            <input
              type="password"
              placeholder="Enter encryption key"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              className="w-full border p-3 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-indigo-300"
            />

            <div className="flex gap-3">
              <button
                onClick={handleKeySubmit}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:opacity-90 transition"
              >
                Unlock & Upload
              </button>

              <button
                onClick={() => setShowKeyModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-xl transition"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  </DashboardLayout>
);
};

export default Upload;