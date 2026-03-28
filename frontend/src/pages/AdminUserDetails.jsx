import React, { useEffect, useState, useRef } from "react";
import {
  FaEye,
  FaDownload,
  FaTrash,
  FaEdit,
  FaUserPlus,
  FaHistory,
  FaLock,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../Layouts/DashboardLayout";
import API from "../api/API";

const AdminUserDetails = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [vaultLocked, setVaultLocked] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [actionKey, setActionKey] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchVaultStatus();
  }, []);

  const fetchVaultStatus = async () => {
    try {
      const res = await API.get("/documents/vault-status");
      setVaultLocked(res.data.isLocked);
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch {
      alert("Failed to fetch users");
    }
  };

  const fetchUserDocs = async (userId) => {
    try {
      const uploadsRes = await API.get("/documents", { params: { userId } });
      setUploads(uploadsRes.data);

      const assignedRes = await API.get("/documents");

      const filteredAssigned = assignedRes.data.filter((doc) => {
        if (!Array.isArray(doc.assignedTo)) return false;

        return doc.assignedTo.some((a) => {
          const assignedUserId = String(a.userId?._id || a.userId);
          return (
            assignedUserId === String(userId) &&
            (a.permissions.view ||
              a.permissions.download ||
              a.permissions.update)
          );
        });
      });

      setAssigned(filteredAssigned);
    } catch {
      alert("Failed to fetch documents");
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setUploads([]);
    setAssigned([]);
    fetchUserDocs(user._id);
  };

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

    if (type === "delete") {
      if (!window.confirm("Delete this document?")) return;

      await API.delete(`/documents/${doc._id}`, config);
      fetchUserDocs(selectedUser._id);
    }

    if (type === "replace") {
      setSelectedDoc(doc);
      fileInputRef.current.click();
    }

    if (type === "assign") {
      navigate(`/assign/${doc._id}`);
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
    setSelectedDoc(doc);
    setShowKeyModal(true);
  }
};

  const confirmSecureAction = () => {
   executeSecureAction(actionType, selectedDoc, {
  headers: { vaultkey: actionKey },
});
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedDoc) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await API.put(
        `/documents/${selectedDoc._id}/replace`,
        formData,
        vaultLocked
          ? { headers: { vaultkey: actionKey } }
          : {}
      );
      fetchUserDocs(selectedUser._id);
    } catch {
      alert("Replace failed");
    }
  };

  const renderCards = (docs) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {docs.length === 0 ? (
        <div className="col-span-full text-center py-10 text-gray-400">
          No documents found
        </div>
      ) : (
        docs.map((doc) => (
          <div
            key={doc._id}
            className="relative bg-white/70 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            {vaultLocked && (
              <FaLock className="absolute top-4 right-4 text-gray-400" />
            )}

            <p className="font-semibold text-gray-800 truncate">
              {doc.filename}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {doc.categoryId?.name || "-"}
            </p>

            <div className="flex items-center justify-between mt-6 text-lg">
              <FaEye
                className="text-blue-600 cursor-pointer hover:scale-110 transition"
                onClick={() => handleSecureClick("view", doc)}
              />
              <FaDownload
                className="text-green-600 cursor-pointer hover:scale-110 transition"
                onClick={() => handleSecureClick("download", doc)}
              />
              <FaEdit
                className="text-yellow-500 cursor-pointer hover:scale-110 transition"
                onClick={() => handleSecureClick("replace", doc)}
              />
              <FaHistory
                className="text-purple-600 cursor-pointer hover:scale-110 transition"
                onClick={() =>
                  navigate(`/documents/history/${doc._id}`)
                }
              />
              <FaTrash
                className="text-red-600 cursor-pointer hover:scale-110 transition"
                onClick={() => handleSecureClick("delete", doc)}
              />
              <FaUserPlus
                className="text-indigo-600 cursor-pointer hover:scale-110 transition"
                onClick={() => handleSecureClick("assign", doc)}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
  <DashboardLayout>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 rounded-3xl">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
          User Documents
        </h2>
      </div>

      {/* ================= USERS GRID ================= */}
      {!selectedUser && (
        <>
          {users.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-lg p-12 rounded-3xl shadow-lg text-center border border-blue-100">
              <p className="text-gray-500 text-lg">
                No users found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => handleUserClick(u)}
                  className="relative cursor-pointer bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:-translate-y-2"
                >
                  {/* Glow */}
                  <div className="absolute top-0 right-0 h-20 w-20 bg-blue-100 rounded-full blur-2xl opacity-30"></div>

                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-inner">
                      {u.firstname?.charAt(0)}
                      {u.lastname?.charAt(0)}
                    </div>

                    <div>
                      <p className="font-semibold text-lg text-gray-800">
                        {u.firstname} {u.lastname}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 text-sm text-indigo-500 font-medium">
                    Click to manage →
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= USER DOCUMENTS VIEW ================= */}
      {selectedUser && (
        <>
          <button
            className="mb-8 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
            onClick={() => setSelectedUser(null)}
          >
            ← Back to Users
          </button>

          <h3 className="text-2xl font-semibold mb-10 text-gray-800">
            {selectedUser.firstname} {selectedUser.lastname}
          </h3>

          {/* ================= UPLOADS ================= */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold text-gray-800">
              User Uploads
            </h4>
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
            {uploads.length === 0 ? (
              <p className="text-gray-400 col-span-full text-center">
                No documents found
              </p>
            ) : (
              uploads.map((doc) => (
                <div
                  key={doc._id}
                  className="relative bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:-translate-y-2"
                >
                  {/* Glow */}
                  <div className="absolute top-0 right-0 h-20 w-20 bg-blue-100 rounded-full blur-2xl opacity-30"></div>

                  {vaultLocked && (
                    <FaLock className="absolute top-4 right-4 text-gray-400" />
                  )}

                  <p className="font-semibold text-gray-800 text-lg truncate">
                    {doc.filename}
                  </p>

                  <p className="text-gray-400 text-xs mt-2">
                    {doc.categoryId?.name || "-"}
                  </p>

                  <div className="flex gap-5 mt-6 text-lg">
                    <FaEye onClick={() => handleSecureClick("view", doc)} className="text-blue-500 cursor-pointer hover:scale-110" />
                    <FaDownload onClick={() => handleSecureClick("download", doc)} className="text-green-500 cursor-pointer hover:scale-110" />
                    <FaEdit onClick={() => handleSecureClick("replace", doc)} className="text-yellow-500 cursor-pointer hover:scale-110" />
                    <FaHistory onClick={() => navigate(`/documents/history/${doc._id}`)} className="text-purple-500 cursor-pointer hover:scale-110" />
                    <FaTrash onClick={() => handleSecureClick("delete", doc)} className="text-red-500 cursor-pointer hover:scale-110" />
                    <FaUserPlus onClick={() => handleSecureClick("assign", doc)} className="text-indigo-500 cursor-pointer hover:scale-110" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ================= ASSIGNED ================= */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold text-gray-800">
              Assigned Documents
            </h4>
            <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {assigned.length === 0 ? (
              <p className="text-gray-400 col-span-full text-center">
                No documents found
              </p>
            ) : (
              assigned.map((doc) => (
                <div
                  key={doc._id}
                  className="relative bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:-translate-y-2"
                >
                  <div className="absolute top-0 right-0 h-20 w-20 bg-green-100 rounded-full blur-2xl opacity-30"></div>

                  {vaultLocked && (
                    <FaLock className="absolute top-4 right-4 text-gray-400" />
                  )}

                  <p className="font-semibold text-gray-800 text-lg truncate">
                    {doc.filename}
                  </p>

                  <p className="text-gray-400 text-xs mt-2">
                    {doc.categoryId?.name || "-"}
                  </p>

                  <div className="flex gap-5 mt-6 text-lg">
                    <FaEye onClick={() => handleSecureClick("view", doc)} className="text-blue-500 cursor-pointer hover:scale-110" />
                    <FaDownload onClick={() => handleSecureClick("download", doc)} className="text-green-500 cursor-pointer hover:scale-110" />
                    <FaEdit onClick={() => handleSecureClick("replace", doc)} className="text-yellow-500 cursor-pointer hover:scale-110" />
                    <FaHistory onClick={() => navigate(`/documents/history/${doc._id}`)} className="text-purple-500 cursor-pointer hover:scale-110" />
                    <FaTrash onClick={() => handleSecureClick("delete", doc)} className="text-red-500 cursor-pointer hover:scale-110" />
                    <FaUserPlus onClick={() => handleSecureClick("assign", doc)} className="text-indigo-500 cursor-pointer hover:scale-110" />
                  </div>
                </div>
              ))
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            hidden
            onChange={handleFileChange}
          />
        </>
      )}

      {/* VAULT MODAL (unchanged) */}
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
              className="w-full bg-indigo-600 text-white py-3 rounded-2xl mb-3"
            >
              Unlock & Continue
            </button>

            <button
              onClick={() => setShowKeyModal(false)}
              className="w-full bg-gray-200 py-3 rounded-2xl"
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

export default AdminUserDetails;