import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../Layouts/DashboardLayout";
import { UserPlus, Trash2, Search } from "lucide-react";
import API from "../api/API";


const UserManagement = () => {
  const [vaultLocked, setVaultLocked] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVaultStatus = async () => {
  try {
    const res = await API.get("/documents/vault-status");
    setVaultLocked(res.data.isLocked);
  } catch (err) {
    console.error("Vault status error:", err);
  }
};
  const fetchUsers = async () => {
    try {
      const res = await API.get("/master-sheet");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
  fetchUsers();
  fetchVaultStatus();
}, []);
  const handleDelete = async (id, key = null) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;

    try {
      await API.delete(`/master-sheet/delete/${id}`);
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Failed to delete client", err);
    }
  };
  const handleKeySubmit = async () => {
  if (!encryptionKey) {
    alert("Enter encryption key");
    return;
  }

  try {
    if (pendingAction) {
      await pendingAction();
    }

    setShowKeyModal(false);
    setEncryptionKey("");
    setPendingAction(null);

  } catch (err) {
    alert(err.response?.data?.message || "Invalid encryption key");
  }
};
const filteredUsers = users.filter((user) => {
  const companyName =
    user.companyName || user.masterSheetData?.companyName || "";

  return companyName
    .toLowerCase()
    .includes(searchTerm.toLowerCase().trim());
});return (
  <DashboardLayout>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 rounded-3xl">

      {/* 🔵 HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">

        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
            Master Sheet Clients
          </h2>
          <p className="text-gray-500 mt-1">
            Manage and monitor your client database
          </p>

          <div className="mt-3 inline-block bg-blue-100 text-blue-700 text-sm px-4 py-1 rounded-full font-medium">
            Total Clients: {users.length}
          </div>
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={() => {
            if (vaultLocked) {
              setPendingAction(() => () =>
                navigate("/generate-master-sheet")
              );
              setShowKeyModal(true);
            } else {
              navigate("/generate-master-sheet");
            }
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <UserPlus size={18} />
          Add Client
        </button>
      </div>

      {/* 🔍 SEARCH */}
      <div className="mb-8 relative max-w-md">
        <Search
          size={18}
          className="absolute left-4 top-3.5 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search by company name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-lg shadow-sm focus:ring-2 focus:ring-indigo-300 outline-none"
        />
      </div>

      {/* 🧾 TABLE CARD */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg border border-blue-100 overflow-hidden">

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No matching clients found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              {/* HEADER */}
              <thead className="bg-gray-50/80 text-gray-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">#</th>
                  <th className="px-6 py-4 text-left">Company</th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-left">Contact</th>
                  <th className="px-6 py-4 text-left">Action</th>
                </tr>
              </thead>

              {/* BODY */}
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user, index) => {
                  const companyName =
                    user.companyName || user.masterSheetData?.companyName;
                  const email =
                    user.email || user.masterSheetData?.email;
                  const contactNumber =
                    user.contactNumber || user.masterSheetData?.contactNumber;

                  return (
                    <tr
                      key={user._id}
                      className="hover:bg-indigo-50/60 transition-all duration-200"
                    >
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {companyName}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {email}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {contactNumber}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            if (vaultLocked) {
                              setPendingAction(() => () =>
                                handleDelete(user._id, encryptionKey)
                              );
                              setShowKeyModal(true);
                            } else {
                              handleDelete(user._id);
                            }
                          }}
                          className="flex items-center gap-2 text-red-500 hover:text-red-700 transition font-medium"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* 🔐 VAULT MODAL (styled consistent) */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl w-96 shadow-2xl border border-indigo-100">

            <h3 className="font-semibold mb-5 text-xl text-gray-800">
              🔐 Vault Locked
            </h3>

            <input
              type="password"
              placeholder="Enter encryption key"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              className="w-full border p-3 rounded-xl mb-5 outline-none focus:ring-2 focus:ring-indigo-200"
            />

            <div className="flex gap-3">
              <button
                onClick={handleKeySubmit}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl transition"
              >
                Unlock & Continue
              </button>

              <button
                onClick={() => setShowKeyModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-2xl transition"
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
export default UserManagement;