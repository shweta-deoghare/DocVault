import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../Layouts/DashboardLayout";
import API from "../api/API";
import { FaEye, FaDownload, FaTrash } from "react-icons/fa";

const DocumentHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);

  const [vaultLocked, setVaultLocked] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [actionKey, setActionKey] = useState("");

  /* ================= FETCH VAULT STATUS ================= */
  const fetchVaultStatus = async () => {
    try {
      const res = await API.get("/documents/vault-status");
      setVaultLocked(res.data.isLocked);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= FETCH HISTORY ================= */
  const fetchHistory = async () => {
    try {
      const res = await API.get(`/documents/history/${id}`);
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.replacedAt) - new Date(a.replacedAt)
      );
      setHistory(sorted);
    } catch (err) {
      alert("Failed to fetch document history");
    }
  };

  useEffect(() => {
    fetchVaultStatus();
    fetchHistory();
  }, []);

  /* ================= SECURE EXECUTION ================= */
  const executeSecureAction = async (type, index, config = {}) => {
  try {
    if (type === "view") {
      const res = await API.get(
        `/documents/${id}/history/${index}/view`,
        { ...config, responseType: "blob" }
      );
      window.open(URL.createObjectURL(res.data));
    }

    if (type === "download") {
      const res = await API.get(
        `/documents/${id}/history/${index}/download`,
        { ...config, responseType: "blob" }
      );

      const a = document.createElement("a");
      a.href = URL.createObjectURL(res.data);
      a.download = history[index]?.filename || "file";
      a.click();
    }

    if (type === "delete") {
      await API.delete(`/documents/history/${id}/${index}`, config);
      fetchHistory();
    }

    setShowKeyModal(false);
    setActionKey("");
  } catch (err) {
    alert(
      err.response?.data?.message ||
      "Invalid encryption key or action failed"
    );
  }
};

  const handleSecureClick = (type, index) => {
  if (type === "delete") {
    if (!window.confirm("Delete this version?")) return;
  }

  if (!vaultLocked) {
    executeSecureAction(type, index);
  } else {
    setActionType(type);
    setSelectedIndex(index);
    setShowKeyModal(true);
  }
};

  const confirmSecureAction = () => {
    executeSecureAction(actionType, selectedIndex, {
  headers: { vaultkey: actionKey },
}); };

  /* ================= UI ================= */
  return (
  <DashboardLayout>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 rounded-3xl">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
          Document History
        </h2>

        <button
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition shadow-sm"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
      </div>

      {/* EMPTY STATE */}
      {history.length === 0 ? (
        <p className="text-gray-500">No previous versions found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {history.map((item, index) => (
            <div
              key={index}
              className="group bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2"
            >
              {/* FILE INFO */}
              <div className="mb-4">
                <p className="font-semibold text-gray-800 text-lg truncate group-hover:text-indigo-600 transition">
                  {item.filename}
                </p>

                <p className="text-gray-400 text-xs mt-2">
                  {new Date(item.replacedAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* ACTION ICONS */}
              <div className="flex gap-5 mt-6 text-lg">

                <FaEye
                  title="View Version"
                  className="text-blue-500 cursor-pointer transition transform hover:scale-110 hover:text-blue-700"
                  onClick={() => handleSecureClick("view", index)}
                />

                <FaDownload
                  title="Download Version"
                  className="text-green-500 cursor-pointer transition transform hover:scale-110 hover:text-green-700"
                  onClick={() => handleSecureClick("download", index)}
                />

                <FaTrash
                  title="Delete Version"
                  className="text-red-500 cursor-pointer transition transform hover:scale-110 hover:text-red-700"
                  onClick={() => handleSecureClick("delete", index)}
                />

              </div>
            </div>
          ))}

        </div>
      )}

      {/* KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">

          <div className="bg-white p-6 rounded-2xl w-96 shadow-2xl">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Enter Encryption Key
            </h2>

            <input
              type="password"
              value={actionKey}
              onChange={(e) => setActionKey(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <button
              onClick={confirmSecureAction}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition"
            >
              Continue
            </button>

            <button
              onClick={() => setShowKeyModal(false)}
              className="mt-3 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>

        </div>
      )}

    </div>
  </DashboardLayout>
);
};

export default DocumentHistory;