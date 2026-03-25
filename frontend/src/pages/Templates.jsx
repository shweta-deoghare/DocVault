import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardLayout from "../Layouts/DashboardLayout";
import { FaFileAlt } from "react-icons/fa";
import API from "../api/API";

const Templates = () => {
  const navigate = useNavigate();

  const [vaultLocked, setVaultLocked] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [pendingRoute, setPendingRoute] = useState(null);

  // Fetch vault lock status
  const fetchVaultStatus = async () => {
  try {

    const res = await API.get("/documents/vault-status");

    console.log("Vault Status:", res.data);

    setVaultLocked(res.data.isLocked);

  } catch (err) {
    console.error("Vault status error:", err);
  }
};

  useEffect(() => {
    fetchVaultStatus();
  }, []);

  // Handle template click
  const handleTemplateClick = (route) => {
    console.log("Vault Locked:", vaultLocked);

    if (vaultLocked) {
      setPendingRoute(route);
      setShowKeyModal(true);
    } else {
      navigate(route);
    }
  };

  // Handle encryption key submit
  const handleKeySubmit = () => {
    if (!encryptionKey) {
      alert("Please enter encryption key");
      return;
    }

    navigate(pendingRoute);

    setShowKeyModal(false);
    setEncryptionKey("");
    setPendingRoute(null);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen px-6 py-12 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col gap-10">

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-blue-900 mb-2">Templates</h2>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-indigo-500 to-blue-500 rounded"></div>
          <p className="text-gray-600 mt-3 text-lg">
            Select a template to open the form
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full">

          {/* Annexure 1 */}
          <div
            onClick={() => handleTemplateClick("/templates/annexure-1")}
            className="cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 flex items-center gap-6 p-10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-white"
          >
            <div className="bg-blue-100 text-blue-600 rounded-full p-4 shadow-md">
              <FaFileAlt size={32} />
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-1">Annexure 1</h3>
              <p className="text-gray-600">Open Annexure 1 form template.</p>
            </div>
          </div>

          {/* Annexure 2 */}
          <div
            onClick={() => handleTemplateClick("/templates/annexure-2")}
            className="cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 flex items-center gap-6 p-10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-white"
          >
            <div className="bg-blue-100 text-blue-600 rounded-full p-4 shadow-md">
              <FaFileAlt size={32} />
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-1">Annexure 2</h3>
              <p className="text-gray-600">Open Annexure 2 form template.</p>
            </div>
          </div>

        </div>

        {/* 🔐 Encryption Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white p-6 rounded-2xl shadow-xl w-96">

              <h3 className="text-xl font-semibold mb-4">
                🔐 Vault Locked
              </h3>

              <input
                type="password"
                placeholder="Enter encryption key"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                className="w-full border p-3 rounded-xl mb-4"
              />

              <div className="flex gap-3">

                <button
                  onClick={handleKeySubmit}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-xl"
                >
                  Unlock
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
    </DashboardLayout>
  );
};

export default Templates;