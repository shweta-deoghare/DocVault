import { useEffect, useState } from "react";
import API from "../api/API";
import DashboardLayout from "../Layouts/DashboardLayout";
import { FaEye, FaDownload } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const userId = user?._id;
  const userRole = user?.role;

  const [categories, setCategories] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [assignedDocs, setAssignedDocs] = useState([]);
  const [vaultLocked, setVaultLocked] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [actionKey, setActionKey] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= FETCH VAULT STATUS ================= */
  const fetchVaultStatus = async () => {
    try {
      const res = await API.get("/documents/vault-status");
      setVaultLocked(res.data.isLocked);
    } catch (err) {
      console.error("Vault status fetch error:", err);
    }
  };

  /* ================= FETCH ALL DATA ================= */
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, documentsRes] = await Promise.all([
        API.get("/categories"),
        API.get("/documents"),
      ]);

      let allDocs = documentsRes.data;

// show only documents uploaded by the logged-in user
allDocs = allDocs.filter(
  (doc) =>
    doc.userId?.toString() === userId ||
    doc.userId?._id?.toString() === userId
);
      /* ================= ASSIGNED DOCS ================= */
      let assigned = [];
      if (userRole === "user") {
        assigned = allDocs.filter((d) =>
          d.sharedWith?.some(
            (s) =>
              s.userId?._id?.toString() === userId ||
              s.userId?.toString() === userId
          )
        );
        setAssignedDocs(assigned);
      }

      const assignedIds = assigned.map((d) => d._id.toString());

      /* ================= FIXED CATEGORY COUNT ================= */
      const categoriesWithCounts = categoriesRes.data.map((cat) => {
        const count = allDocs.filter((d) => {
          const docCategoryId =
            typeof d.categoryId === "object"
              ? d.categoryId?._id?.toString()
              : d.categoryId?.toString();

          return (
            docCategoryId === cat._id.toString() &&
            !assignedIds.includes(d._id.toString())
          );
        }).length;

        return { ...cat, count };
      });

      setCategories(categoriesWithCounts);

      /* ================= RECENT DOCS ================= */
      const recent = allDocs
        .filter((d) => !assignedIds.includes(d._id.toString()))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setRecentDocs(recent);

      await fetchVaultStatus();
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (userId) {
    fetchAllData();
  }
}, [userId]);

  /* ================= SECURE ACTION ================= */
const executeSecureAction = async (doc, type, config = {}) => {
  console.log("CLICKED DOC:", doc);
  console.log("USER:", user);

  try {
    let res;

    if (type === "view") {
      res = await API.get(`/documents/${doc._id}/view`, config);
      window.open(res.data.url, "_blank");
    }

    if (type === "download") {
      res = await API.get(`/documents/${doc._id}/download`, config);
      const a = document.createElement("a");
      a.href = res.data.url;
      a.target = "_blank";
      a.click();
    }

    setShowKeyModal(false);
    setActionKey("");
  } catch (err) {
    alert(err.response?.data?.message || "Invalid encryption key");
  }
};
const handleSecureClick = (type, doc) => {
  if (!vaultLocked) {
    executeSecureAction(doc, type);
  } else {
    setActionType(type);
    setSelectedDoc(doc);
    setShowKeyModal(true);
  }
};
  const confirmSecureAction = () => {
    executeSecureAction(selectedDoc, actionType, {
  headers: { vaultkey: actionKey },
});
  };

  /* ================= DOCUMENT CARD ================= */
  const DocumentCard = ({ doc }) => (
    <div className="bg-white p-6 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] border border-gray-100">
      <p className="font-semibold text-gray-800 text-lg truncate">
        {doc.filename}
      </p>

      <p className="text-gray-500 text-xs mt-2">
        Uploaded on {new Date(doc.createdAt).toLocaleString("en-IN")}
      </p>

      <div className="flex gap-4 mt-5">
        <FaEye
          className="text-blue-600 cursor-pointer hover:text-blue-800 transition"
          onClick={() => handleSecureClick("view", doc)}
        />
        <FaDownload
          className="text-green-600 cursor-pointer hover:text-green-800 transition"
          onClick={() => handleSecureClick("download", doc)}
        />
      </div>
    </div>
  );

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Premium Styled Dashboard (Only UI improvements applied)

return ( <DashboardLayout> {/* PAGE WRAPPER */} <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 rounded-3xl">

{/* HEADER */}
  <h2 className="text-3xl font-bold mb-8 text-gray-800 tracking-tight">
    Dashboard Overview
  </h2>

  {/* ================= CATEGORIES ================= */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
    {categories.map((c) => (
      <div
        key={c._id}
        className="relative bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:-translate-y-1"
      >
        <div className="absolute top-0 right-0 h-20 w-20 bg-blue-100 rounded-full blur-2xl opacity-30"></div>

        <p className="font-semibold text-gray-700 text-lg">
          {c.name}
        </p>

        <p className="text-indigo-600 mt-4 text-3xl font-bold">
          {c.count}
          <span className="text-sm text-gray-400 ml-2 font-medium">
            docs
          </span>
        </p>
      </div>
    ))}
  </div>

  {/* ================= RECENT UPLOADS ================= */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-2xl font-semibold text-gray-800">
      Recent Uploads
    </h3>
    <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
    {recentDocs.map((d) => (
      <div
        key={d._id}
        className="group bg-white p-6 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2"
      >
        <p className="font-semibold text-gray-800 text-lg truncate group-hover:text-indigo-600 transition">
          {d.filename}
        </p>

        <p className="text-gray-400 text-xs mt-2">
          {new Date(d.createdAt).toLocaleString("en-IN")}
        </p>

        <div className="flex gap-5 mt-6 text-lg">
          <FaEye
            className="text-blue-500 cursor-pointer hover:scale-110 hover:text-blue-700 transition"
            onClick={() => handleSecureClick("view", d)}
          />
          <FaDownload
            className="text-green-500 cursor-pointer hover:scale-110 hover:text-green-700 transition"
            onClick={() => handleSecureClick("download", d)}
          />
        </div>
      </div>
    ))}
  </div>

  {/* ================= ASSIGNED ================= */}
  {userRole === "user" && assignedDocs.length > 0 && (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold text-gray-800">
          Assigned Documents
        </h3>
        <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignedDocs.map((d) => (
          <div
            key={d._id}
            className="group bg-white p-6 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2"
          >
            <p className="font-semibold text-gray-800 text-lg truncate group-hover:text-green-600 transition">
              {d.filename}
            </p>

            <p className="text-gray-400 text-xs mt-2">
              {new Date(d.createdAt).toLocaleString("en-IN")}
            </p>

            <div className="flex gap-5 mt-6 text-lg">
              <FaEye
                className="text-blue-500 cursor-pointer hover:scale-110 hover:text-blue-700 transition"
                onClick={() => handleSecureClick("view", d)}
              />
              <FaDownload
                className="text-green-500 cursor-pointer hover:scale-110 hover:text-green-700 transition"
                onClick={() => handleSecureClick("download", d)}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  )}
</div>
{/* 🔐 ENCRYPTION KEY MODAL */}
{showKeyModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">

    <div className="bg-white p-6 rounded-3xl w-96 shadow-xl">
      <h3 className="text-lg font-semibold mb-4">
        🔐 Enter Encryption Key
      </h3>

      <input
        type="password"
        placeholder="Enter key"
        value={actionKey}
        onChange={(e) => setActionKey(e.target.value)}
        className="w-full p-3 border rounded-xl mb-4 focus:ring-2 focus:ring-indigo-300"
      />

      <div className="flex gap-3">
        <button
          onClick={confirmSecureAction}
          className="flex-1 bg-blue-600 text-white py-2 rounded-xl"
        >
          Submit
        </button>

        <button
          onClick={() => setShowKeyModal(false)}
          className="flex-1 bg-gray-200 py-2 rounded-xl"
        >
          Cancel
        </button>
      </div>
    </div>

  </div>
)}
  </DashboardLayout>
);
};

export default Dashboard;