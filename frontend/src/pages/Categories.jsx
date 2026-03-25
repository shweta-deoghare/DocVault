import { useEffect, useState, useMemo } from "react";
import API from "../api/API";
import DashboardLayout from "../Layouts/DashboardLayout";
import {
  FaEye,
  FaDownload,
  FaEdit,
  FaUserPlus,
  FaHistory,
  FaTrash,
} from "react-icons/fa";
import _ from "lodash";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Categories = () => {
  const { user } = useAuth();

  const userId = user?._id;
  const userRole = user?.role;

  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedDocs, setSelectedDocs] = useState([]);

  const [vaultLocked, setVaultLocked] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [actionKey, setActionKey] = useState("");

  const navigate = useNavigate();

  /* ================= FETCH VAULT ================= */
  const fetchVaultStatus = async () => {
    try {
      const res = await API.get("/documents/vault-status");
      setVaultLocked(res.data.isLocked);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= FETCH CATEGORIES ================= */
  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= FETCH DOCUMENTS ================= */
  const fetchDocuments = async (categoryId = "", search = "") => {
    if (!userId) return;

    try {
      const params = {
        categoryId: categoryId || undefined,
        search: search || undefined,
        ...(userRole === "admin" ? { userId } : {}),
      };

      const res = await API.get("/documents", { params });
      let docs = res.data;

      // Remove assigned docs for normal user
      if (userRole === "user") {
        const assignedRes = await API.get("/documents");
        const assigned = assignedRes.data.filter((d) =>
          d.sharedWith?.some(
            (s) =>
              s.userId?._id?.toString() === userId ||
              s.userId?.toString() === userId
          )
        );

        const assignedIds = assigned.map((d) => d._id.toString());
        docs = docs.filter(
          (d) => !assignedIds.includes(d._id.toString())
        );
      }

      setDocuments(docs);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    if (!userId) return;

    fetchVaultStatus();
    fetchCategories();
    fetchDocuments();
  }, [userId]);

  /* ================= DEBOUNCE SEARCH ================= */
  const debouncedFetch = useMemo(
    () =>
      _.debounce((text, category) => {
        fetchDocuments(category, text);
      }, 300),
    [userId]
  );

  useEffect(() => {
    if (!userId) return;

    debouncedFetch(searchText, selectedCategory);

    return () => debouncedFetch.cancel();
  }, [searchText, selectedCategory]);

  /* ================= SECURE ACTION ================= */
  const executeAction = async (type, id = null, config = {}) => {
  try {
    if (type === "view") {
      const res = await API.get(`/documents/${id}/view`, {
        ...config,
        responseType: "blob",
      });
      window.open(URL.createObjectURL(res.data));
    }

    if (type === "download") {
      const res = await API.get(`/documents/${id}/download`, {
        ...config,
        responseType: "blob",
      });

      const a = document.createElement("a");
      a.href = URL.createObjectURL(res.data);
      a.download =
        documents.find((d) => d._id === id)?.filename || "file";
      a.click();
    }

    if (type === "replace") {
      const input = document.createElement("input");
      input.type = "file";

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        await API.put(`/documents/${id}/replace`, formData, config);

        fetchDocuments(selectedCategory, searchText);
      };

      input.click();
    }

    if (type === "history") {
      navigate(`/documents/history/${id}`);
    }

    if (type === "assign") {
      navigate(`/assign/${id}`);
    }

    if (type === "deleteSelected") {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete ${selectedDocs.length} document(s)?`
      );

      if (!confirmDelete) {
        setShowKeyModal(false);
        return;
      }

      const res = await API.delete("/documents/bulk-delete", {
        data: { documentIds: selectedDocs },
        ...config,
      });

      setDocuments((prev) =>
        prev.filter((doc) => !selectedDocs.includes(doc._id))
      );

      setSelectedDocs([]);

      alert(res.data.message || "Documents deleted successfully!");
    }

    setShowKeyModal(false);
    setActionKey("");
  } catch (err) {
    alert(
      err.response?.data?.message ||
        "Invalid encryption key or no permission"
    );
  }
};

const handleSecureClick = (type, id = null) => {
  if (!vaultLocked) {
    executeAction(type, id);
  } else {
    setActionType(type);
    setSelectedDocId(id);
    setShowKeyModal(true);
  }
};
  const confirmSecureAction = () => {
    executeAction(actionType, selectedDocId, {
  headers: { vaultkey: actionKey },
}); };

  const handleCheckboxChange = (docId) => {
    setSelectedDocs((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.toLocaleDateString()} • ${d.toLocaleTimeString()}`;
  };

  /* ================= UI ================= */
 return (
  <DashboardLayout>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 rounded-3xl">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
          Documents
        </h2>

        {selectedDocs.length > 0 && (
          <button
            onClick={() => handleSecureClick("deleteSelected")}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <FaTrash /> Delete Selected
          </button>
        )}
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg border border-blue-100 mb-10">
        <div className="grid md:grid-cols-2 gap-6">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-3 rounded-xl border border-gray-200 bg-white/80 outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="🔍 Search documents..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="p-3 rounded-xl border border-gray-200 bg-white/80 outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* DOCUMENT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div
            key={doc._id}
            className="relative bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:-translate-y-2"
          >
            {/* Glow effect */}
            <div className="absolute top-0 right-0 h-20 w-20 bg-blue-100 rounded-full blur-2xl opacity-30"></div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedDocs.includes(doc._id)}
                onChange={() => handleCheckboxChange(doc._id)}
                className="mt-2 accent-indigo-600"
              />

              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-lg truncate">
                  {doc.filename}
                </p>

                {doc.createdAt && (
                  <p className="text-gray-400 text-xs mt-2">
                    {formatDate(doc.createdAt)}
                  </p>
                )}
              </div>
            </div>

            {/* ACTION ICONS */}
      <div className="flex gap-5 mt-6 text-lg">

  <FaEye
    title="View"
    className="text-blue-500 cursor-pointer transition transform hover:scale-110 hover:text-blue-700"
    onClick={() => handleSecureClick("view", doc._id)}
  />

  <FaDownload
    title="Download"
    className="text-green-500 cursor-pointer transition transform hover:scale-110 hover:text-green-700"
    onClick={() => handleSecureClick("download", doc._id)}
  />

  <FaEdit
    title="Replace"
    className="text-yellow-500 cursor-pointer transition transform hover:scale-110 hover:text-yellow-600"
    onClick={() => handleSecureClick("replace", doc._id)}
  />

  <FaHistory
    title="History"
    className="text-purple-500 cursor-pointer transition transform hover:scale-110 hover:text-purple-700"
    onClick={() => handleSecureClick("history", doc._id)}
  />

  {userRole === "admin" && (
    <FaUserPlus
      title="Assign"
      className="text-indigo-500 cursor-pointer transition transform hover:scale-110 hover:text-indigo-700"
      onClick={() => handleSecureClick("assign", doc._id)}
    />
  )}

</div>
          </div>
        ))}
      </div>

      {/* VAULT MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl w-96 shadow-2xl border border-white/40">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              🔐 Vault Locked
            </h2>

            <input
              type="password"
              value={actionKey}
              onChange={(e) => setActionKey(e.target.value)}
              placeholder="Enter Encryption Key"
              className="w-full border p-3 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-300"
            />

            <button
              onClick={confirmSecureAction}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-medium mb-2 hover:opacity-90"
            >
              Unlock & Continue
            </button>

            <button
              onClick={() => setShowKeyModal(false)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl"
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

export default Categories;