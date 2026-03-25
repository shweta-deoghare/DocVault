import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../Layouts/DashboardLayout";
import API from "../api/API";
import { FaFileAlt, FaUserPlus, FaSearch } from "react-icons/fa";

const GenerateDossier = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [vaultLocked, setVaultLocked] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/master-sheet");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };

    const fetchVaultStatus = async () => {
      try {
        const res = await API.get("/documents/vault-status");
        setVaultLocked(res.data.isLocked);
      } catch (err) {
        console.error("Vault status error:", err);
      }
    };

    fetchUsers();
    fetchVaultStatus();
  }, []);

  const handleProceed = () => {
    if (!selectedUser || !selectedTemplate) {
      alert("Please select both template and client");
      return;
    }

    if (vaultLocked) {
      setShowKeyModal(true);
    } else {
      navigate(`/generate/${selectedTemplate}/${selectedUser._id}`);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeySubmit = () => {
    if (!encryptionKey) {
      alert("Enter encryption key");
      return;
    }

    navigate(`/generate/${selectedTemplate}/${selectedUser._id}`, {
      state: { vaultkey: encryptionKey },
    });

    setShowKeyModal(false);
    setEncryptionKey("");
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-white">

        {/* HEADER */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800">Generate Dossier</h2>
        </div>

        {/* STEP 1: TEMPLATE SELECTION */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
            <FaFileAlt className="text-blue-600" /> Step 1: Select Template
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {["annexure-1", "annexure-2"].map((template) => {
              const isSelected = selectedTemplate === template;
              return (
                <div
                  key={template}
                  onClick={() => setSelectedTemplate(template)}
                  className={`relative p-5 rounded-3xl transition-all duration-300 border shadow-md hover:shadow-xl hover:-translate-y-1
                    ${isSelected 
                      ? "border-2 border-blue-600 bg-blue-50 shadow-2xl scale-[1.03]" 
                      : "border border-blue-100 bg-white"
                    }`}
                >
                  {/* Glow behind card */}
                  <div className="absolute top-0 right-0 h-20 w-20 bg-blue-100/30 rounded-full blur-2xl opacity-50"></div>

                  <div className="flex items-center gap-2 mb-2">
                    <FaFileAlt className={`text-blue-500 ${isSelected ? "text-blue-700" : ""}`} />
                    <h3 className="text-lg font-semibold capitalize">{template.replace("-", " ")}</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {template === "annexure-1"
                      ? "Standard compliance template"
                      : "Detailed reporting template"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 2: CLIENT SELECTION */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
            <FaUserPlus className="text-blue-600" /> Step 2: Select Client
          </h3>

          {/* SEARCH */}
          <div className="relative max-w-md mb-8">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* CLIENT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => {
              const isSelected = selectedUser?._id === user._id;
              return (
                <div
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`relative p-5 rounded-3xl transition-all duration-300 border shadow-md hover:shadow-xl hover:-translate-y-1
                    ${isSelected 
                      ? "border-2 border-blue-600 bg-blue-50 shadow-2xl scale-[1.03]" 
                      : "border border-blue-100 bg-white"
                    }`}
                >
                  {/* Glow behind card */}
                  <div className="absolute top-0 right-0 h-20 w-20 bg-blue-100/30 rounded-full blur-2xl opacity-50"></div>

                  <div className="flex items-center gap-3 mb-3">
                    <FaUserPlus className={`text-lg ${isSelected ? "text-blue-700" : "text-blue-500"}`} />
                    <h3 className="text-lg font-semibold text-gray-800 truncate">{user.companyName}</h3>
                  </div>
                  <p className="text-gray-600 text-sm truncate">{user.email}</p>
                  <p className="text-gray-600 text-sm truncate">{user.contactNumber}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* GENERATE BUTTON */}
        <button
          onClick={handleProceed}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-2xl shadow-md hover:shadow-lg transition"
        >
          Generate Dossier
        </button>

        {/* VAULT MODAL */}
        {showKeyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-3xl w-96 shadow-2xl border border-gray-200">
              <h3 className="font-semibold mb-4 text-xl">🔐 Vault Locked</h3>
              <input
                type="password"
                placeholder="Enter encryption key"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                className="w-full border p-3 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleKeySubmit}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl"
                >
                  Unlock & Generate
                </button>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-xl"
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

export default GenerateDossier;