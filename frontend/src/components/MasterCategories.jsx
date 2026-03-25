import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import API from "../api/API";

const MasterCategories = ({ currentUser }) => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");

  const [vaultLocked, setVaultLocked] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [actionType, setActionType] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  /* ================= FETCH ================= */
  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      const all = res.data;

      let filtered;
      if (currentUser.role === "admin") {
        filtered = all.filter(c => c.createdByRole === "admin");
      } else {
        filtered = all.filter(
          c => c.createdByRole === "admin" || c.createdBy === currentUser._id
        );
      }

      setCategories(filtered);
    } catch {
      alert("Failed to fetch categories");
    }
  };

  const fetchVaultStatus = async () => {
    try {
      const res = await API.get("/documents/vault-status");
      setVaultLocked(res.data.isLocked);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchVaultStatus();
  }, []);

  /* ================= API ACTIONS ================= */
  const addCategory = async (key = null) => {
    return await API.post(
      "/categories",
      {
        name,
        createdBy: currentUser._id,
        createdByRole: currentUser.role,
      },
      key
        ? {
            headers: { vaultkey: key },
          }
        : {}
    );
  };

  const deleteCategory = async (id, key = null) => {
    return await API.delete(`/categories/${id}`, {
      headers: key ? { vaultkey: key } : {},
    });
  };

  /* ================= HANDLERS ================= */
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!name) return alert("Enter category name");

    if (vaultLocked) {
      setActionType("add");
      setShowKeyModal(true);
      return;
    }

    try {
      await addCategory();
      alert("Category added ✅");
      setName("");
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Add failed");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    if (vaultLocked) {
      setActionType("delete");
      setSelectedId(id);
      setShowKeyModal(true);
      return;
    }

    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c._id !== id));
      alert("Category deleted ✅");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  /* ================= KEY SUBMIT ================= */
  const handleKeySubmit = async () => {
    if (!encryptionKey) return alert("Enter encryption key");

    try {
      if (actionType === "add") {
        await addCategory(encryptionKey);
        alert("Category added 🔐");
        setName("");
      }

      if (actionType === "delete") {
        await deleteCategory(selectedId, encryptionKey);
        setCategories(prev => prev.filter(c => c._id !== selectedId));
        alert("Category deleted 🔐");
      }

      setShowKeyModal(false);
      setEncryptionKey("");
      fetchCategories();

    } catch (err) {
      alert(err.response?.data?.message || "Invalid encryption key");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-800">
          Category Management
        </h3>

        <span className="text-sm px-3 py-1 rounded-full bg-indigo-100 text-indigo-600">
          {categories.length} Categories
        </span>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ADD */}
        <form
          onSubmit={handleAddCategory}
          className="bg-white p-8 rounded-3xl shadow-md border border-indigo-100 h-fit"
        >
          <div className="space-y-4">

            <input
              type="text"
              placeholder="Enter category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none"
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl shadow-md hover:opacity-90"
            >
              Add Category
            </button>
          </div>
        </form>

        {/* LIST */}
        <div className="bg-white p-6 rounded-3xl shadow-md border border-indigo-100 max-h-[600px] overflow-y-auto">

          <h4 className="text-lg font-semibold mb-4">
            All Categories
          </h4>

          {categories.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No categories found.
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {cat.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cat.createdByRole === "admin"
                        ? "Admin category"
                        : "Your category"}
                    </p>
                  </div>

                  {((currentUser.role === "admin" &&
                    cat.createdByRole === "admin") ||
                    (currentUser.role === "user" &&
                      cat.createdBy === currentUser._id)) && (
                    <FaTrash
                      onClick={() => handleDeleteCategory(cat._id)}
                      className="cursor-pointer text-red-500 hover:text-red-700"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 🔐 MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-3xl w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              🔐 Enter Encryption Key
            </h3>

            <input
              type="password"
              placeholder="Enter key"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              className="w-full p-3 border rounded-xl mb-4 focus:ring-2 focus:ring-indigo-300"
            />

            <div className="flex gap-3">
              <button
                onClick={handleKeySubmit}
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

    </div>
  );
};

export default MasterCategories;