import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../Layouts/DashboardLayout";
import API from "../api/API";
import { FaEye, FaDownload, FaEdit } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const AssignedDocuments = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const fileInputRef = useRef(null);
  const [selectedDocId, setSelectedDocId] = useState(null);

  /* 🔐 VAULT STATES */
  const [vaultLocked, setVaultLocked] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionKey, setActionKey] = useState("");

  /* ================= FETCH VAULT STATUS ================= */
  const fetchVaultStatus = async () => {
    try {
      const res = await API.get("/documents/vault-status");
      setVaultLocked(res.data.isLocked);
    } catch (err) {
      console.error("Vault status error:", err);
    }
  };

  /* ================= FETCH ASSIGNED ================= */
  useEffect(() => {
    fetchVaultStatus();

    const fetchAssigned = async () => {
      try {
        const res = await API.get("/documents/assigned");

        const filteredDocs = res.data.filter((doc) => {
          const perms = doc.permissions || {};
          return perms.view || perms.download || perms.update;
        });

        setDocs(filteredDocs);
      } catch (err) {
        alert("Unable to fetch assigned documents");
      }
    };

    fetchAssigned();
  }, []);

  /* ================= SECURE EXECUTION ================= */
  const executeSecureAction = async (type, doc, config = {}) => {
  try {

    if (type === "view") {
      const res = await API.get(`/documents/${doc._id}/view`, config);
      window.open(res.data.url, "_blank");
    }

    if (type === "download") {
      const res = await API.get(`/documents/${doc._id}/download`, config);
      const a = document.createElement("a");
      a.href = res.data.url;
      a.target = "_blank";
      a.click();
    }

    if (type === "replace") {
      setSelectedDocId(doc._id);
      fileInputRef.current.click();
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

  const handleSecureClick = (type, doc) => {
  if (!vaultLocked) {
    executeSecureAction(type, doc);
  } else {
    setActionType(type);
    setSelectedDocId(doc);
    setShowKeyModal(true);
  }
};
 const confirmSecureAction = () => {
    executeSecureAction(actionType, selectedDocId, {
  headers: { vaultkey: actionKey },
}); };

  /* ================= REPLACE FILE ================= */
  const handleReplaceFile = async (e) => {
  const file = e.target.files[0];
  if (!file || !selectedDocId) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    await API.put(
      `/documents/${selectedDocId}/replace`,
      formData,
      vaultLocked
        ? { headers: { vaultkey: actionKey } }
        : {}
    );

    alert("Document replaced successfully");

    setDocs((prevDocs) =>
      prevDocs.map((doc) =>
        doc._id === selectedDocId
          ? { ...doc, filename: file.name }
          : doc
      )
    );

    fileInputRef.current.value = "";
    setSelectedDocId(null);

  } catch {
    alert("Failed to replace document");
  }
};
return (
  <DashboardLayout>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 rounded-3xl">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
          Assigned Documents
        </h2>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        hidden
        onChange={handleReplaceFile}
      />

      {/* EMPTY STATE */}
      {docs.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-lg p-12 rounded-3xl shadow-lg border border-blue-100 text-center">
          <p className="text-gray-500 text-lg">
            No documents assigned to you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc) => {
            const perms = doc.permissions || {};

            return (
              <div
                key={doc._id}
                className="relative bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:-translate-y-2"
              >
                {/* Glow */}
                <div className="absolute top-0 right-0 h-20 w-20 bg-blue-100 rounded-full blur-2xl opacity-30"></div>

                {/* FILE NAME */}
                <p
                  className="font-semibold text-gray-800 text-lg truncate"
                  title={doc.filename}
                >
                  {doc.filename}
                </p>

                {/* PERMISSION BADGES */}
                <div className="flex flex-wrap gap-2 mt-4 text-xs">
                  {perms.view && (
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                      View
                    </span>
                  )}
                  {perms.download && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                      Download
                    </span>
                  )}
                  {perms.update && (
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                      Update
                    </span>
                  )}
                </div>

                {/* ACTION ICONS */}
                <div className="flex gap-6 mt-6 text-xl">
                  {perms.view && (
                    <FaEye
                      onClick={() => handleSecureClick("view", doc)}
                      className="cursor-pointer text-blue-500 hover:text-blue-700 hover:scale-110 transition"
                    />
                  )}
                  {perms.download && (
                    <FaDownload
                      onClick={() => handleSecureClick("download", doc)}
                      className="cursor-pointer text-green-500 hover:text-green-700 hover:scale-110 transition"
                    />
                  )}
                  {perms.update && (
                    <FaEdit
                      onClick={() => handleSecureClick("replace", doc)}
                      className="cursor-pointer text-yellow-500 hover:text-yellow-700 hover:scale-110 transition"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🔐 VAULT MODAL (UNCHANGED DESIGN CONSISTENCY) */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-3xl w-96 shadow-2xl border border-indigo-100">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              🔐 Vault Locked
            </h2>

            <input
              type="password"
              value={actionKey}
              onChange={(e) => setActionKey(e.target.value)}
              placeholder="Enter Encryption Key"
              className="w-full border p-3 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-indigo-200"
            />

            <button
              onClick={confirmSecureAction}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-medium mb-3 transition"
            >
              Unlock & Continue
            </button>

            <button
              onClick={() => setShowKeyModal(false)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-2xl transition"
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

export default AssignedDocuments;