import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaHome,
  FaFolderOpen,
  FaUpload,
  FaUsers,
  FaUserCog,
  FaShieldAlt,
  FaLock,
  FaUnlock,
  FaFileAlt,
  FaBell,
  FaTrash,
  FaUser,
  FaIdCard,
  FaLayerGroup,
  FaFileSignature,
} from "react-icons/fa";
import API from "../api/API";

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [vaultModal, setVaultModal] = useState(false);
  const [vaultLocked, setVaultLocked] = useState(false);
  const [vaultKeyInput, setVaultKeyInput] = useState("");
  const [vaultRequiresSetup, setVaultRequiresSetup] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const userRole = user?.role;
  const fullName = user ? `${user.firstname} ${user.lastname}` : "";
  const roleLabel = userRole === "admin" ? "Admin" : "User";

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ================= FETCH NOTIFICATIONS ================= */
  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= FETCH VAULT STATUS ================= */
  

  useEffect(() => {
    fetchVaultStatus();
    if (userRole === "user") fetchNotifications();
  }, [userRole]);

  /* ================= CLOSE NOTIF ON OUTSIDE CLICK ================= */
  useEffect(() => {
  const handleClickOutside = (event) => {
    // Notifications close
    if (notifRef.current && !notifRef.current.contains(event.target)) {
      setNotifOpen(false);
    }

    // Profile dropdown close
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

  /* ================= MARK AS READ ================= */
  const markAsRead = async (id) => {
    await API.put(`/notifications/${id}/read`);
    fetchNotifications();
  };

  /* ================= DELETE NOTIFICATION ================= */
  const deleteNotification = async (id) => {
    await API.delete(`/notifications/${id}`);
    fetchNotifications();
  };

  /* ================= HANDLE LOCK/UNLOCK ================= */
/* ================= HANDLE LOCK/UNLOCK ================= */
/* ================= FETCH VAULT STATUS ================= */
const fetchVaultStatus = async () => {
  try {
    console.log("Fetching vault status...");

    const res = await API.get("/documents/vault-status");

    console.log("Vault status response:", res.data);

    setVaultLocked(res.data.isLocked);
    setVaultRequiresSetup(!res.data.hasKey);

  } catch (err) {
    console.error("Vault status error:", err.response?.data || err);
  }
};
const handleLockUnlock = async () => {

  console.log("Vault operation started");
  console.log("Vault Locked:", vaultLocked);
  console.log("Requires Setup:", vaultRequiresSetup);
  console.log("Sending key:", vaultKeyInput);

  try {

    // CREATE KEY
    if (vaultRequiresSetup) {

      if (!vaultKeyInput || vaultKeyInput.length < 6) {
        return alert("Key must be at least 6 characters");
      }

      const res = await API.post("/documents/vault/create-key", {
        key: vaultKeyInput,
      });

      console.log("Create key response:", res.data);

      setVaultRequiresSetup(false);
      setVaultLocked(false);

    }

    // UNLOCK
    else if (vaultLocked) {

      if (!vaultKeyInput) {
        return alert("Enter vault key");
      }

      const res = await API.post("/documents/vault/unlock", {
        key: vaultKeyInput,
      });

      localStorage.setItem("vaultKey", vaultKeyInput);

      console.log("Unlock response:", res.data);

      setVaultLocked(false);

    }

    // LOCK
    else {

      const res = await API.post("/documents/vault/lock");

      console.log("Lock response:", res.data);

      localStorage.removeItem("vaultKey");

      setVaultLocked(true);
    }

    setVaultKeyInput("");
    setVaultModal(false);

  } catch (err) {

    console.error("Vault operation error:", err.response?.data || err);

    alert(
      err.response?.data?.message ||
      "Vault operation failed"
    );
  }
};/* ================= HANDLE LOCK/UNLOCK ================= */
  // ================= RETURN JSX =================
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* ...Your full JSX as in the last snippet, including sidebar, navbar, main content, profile & vault modals... */}
      {/* ================= SIDEBAR ================= */}
    <aside className="w-64 bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white flex flex-col shadow-2xl">

  {/* Logo */}
  <div className="p-6 font-bold text-xl flex items-center gap-3 border-b border-white/10">
    <FaShieldAlt className="text-indigo-400 text-2xl" />
    <span className="tracking-wide">DocVault</span>
  </div>

  {/* Nav */}
 <nav className="flex-1 flex flex-col gap-3 p-5 text-sm font-medium">

  {/* Dashboard */}
  <NavLink
    to="/dashboard"
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
        isActive
          ? "bg-indigo-500 text-white shadow-md scale-[1.02]"
          : "hover:bg-white/10 hover:scale-[1.02]"
      }`
    }
  >
    <FaHome /> Dashboard
  </NavLink>

  {/* Documents */}
  <NavLink
    to="/categories"
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
        isActive
          ? "bg-indigo-500 text-white shadow-md scale-[1.02]"
          : "hover:bg-white/10 hover:scale-[1.02]"
      }`
    }
  >
    <FaFolderOpen />My Documents
  </NavLink>

  {/* Upload */}
  <NavLink
    to="/upload"
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
        isActive
          ? "bg-indigo-500 text-white shadow-md scale-[1.02]"
          : "hover:bg-white/10 hover:scale-[1.02]"
      }`
    }
  >
    <FaUpload /> Upload Docs
  </NavLink>

  {/* Master */}
  <NavLink
    to="/master"
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
        isActive
          ? "bg-indigo-500 text-white shadow-md scale-[1.02]"
          : "hover:bg-white/10 hover:scale-[1.02]"
      }`
    }
  >
    <FaUserCog /> Master Settings
  </NavLink>

  {/* ================= ADMIN ONLY ================= */}
  {userRole === "admin" && (
    <>
      <NavLink
        to="/admin/user-details"
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
            isActive
              ? "bg-indigo-500 text-white shadow-md scale-[1.02]"
              : "hover:bg-white/10 hover:scale-[1.02]"
          }`
        }
      >
        <FaUsers /> User Details
      </NavLink>

      <NavLink
        to="/documents"
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
            isActive
              ? "bg-indigo-500 text-white shadow-md scale-[1.02]"
              : "hover:bg-white/10 hover:scale-[1.02]"
          }`
        }
      >
        <FaIdCard /> Client Master
      </NavLink>

      <NavLink
        to="/templates"
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
            isActive
              ? "bg-indigo-500 text-white shadow-md scale-[1.02]"
              : "hover:bg-white/10 hover:scale-[1.02]"
          }`
        }
      >
        <FaLayerGroup /> Templates
      </NavLink>

      <NavLink
        to="/generate-dossier"
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
            isActive
              ? "bg-indigo-500 text-white shadow-md scale-[1.02]"
              : "hover:bg-white/10 hover:scale-[1.02]"
          }`
        }
      >
        <FaFileSignature /> Generate Dossier
      </NavLink>
    </>
  )}

  {/* ================= USER ONLY ================= */}
  {userRole === "user" && (
    <NavLink
      to="/assigned-documents"
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
          isActive
            ? "bg-indigo-500 text-white shadow-md scale-[1.02]"
            : "hover:bg-white/10 hover:scale-[1.02]"
        }`
      }
    >
      <FaFileAlt /> Assigned Documents
    </NavLink>
  )}

</nav>
</aside>

    {/* ================= MAIN ================= */}
    <div className="flex-1 flex flex-col">
      {/* ================= NAVBAR ================= */}
      <header className="h-16 backdrop-blur-md bg-white/70 border-b border-gray-200 flex items-center justify-between px-6 shadow-sm relative z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
  <FaShieldAlt className="text-indigo-500 text-2xl" />
  <h1 className="font-semibold text-gray-800">
    Secure Document Management And Generation System
  </h1>
</div><div
  onClick={() => setVaultModal(true)}
  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
    vaultLocked
      ? "bg-red-100 text-red-600"
      : "bg-green-100 text-green-600"
  }`}
>
  {vaultLocked ? <FaLock /> : <FaUnlock />}
  {vaultLocked ? "Locked" : "Unlocked"}
</div>
        </div>

        <div className="flex items-center gap-6">
          {userRole === "user" && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative text-xl"
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[1000]">
                  <div className="p-3 font-semibold border-b">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No notifications</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-3 text-sm border-b hover:bg-gray-50 transition flex justify-between ${
                          !notif.read ? "bg-blue-100" : ""
                        }`}
                      >
                        <div
                          onClick={async () => {
                            await markAsRead(notif._id);
                            navigate("/assigned-documents");
                            setNotifOpen(false);
                          }}
                          className="flex-1"
                        >
                          {notif.message}
                        </div>

                        <FaTrash
                          className="text-red-500 ml-3 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif._id);
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="px-3 py-1 rounded-full text-xs bg-indigo-500/20 border border-indigo-400">
            {roleLabel}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 bg-blue-800 text-white rounded-full"
            >
              <FaUser />
              <span>{fullName}</span>
            </button>

           {dropdownOpen && (
  <div className="absolute right-0 mt-3 w-56 bg-white text-black rounded-xl shadow-2xl z-[9999] border border-gray-100 animate-fadeIn">
    <button
      onClick={() => {
        setShowProfile(true);
        setDropdownOpen(false);
      }}
      className="block w-full text-left px-4 py-3 hover:bg-gray-100"
    >
      👤 Profile
    </button>

    <button
      onClick={() => {
        setVaultModal(true);
        setDropdownOpen(false);
      }}
      className="block w-full text-left px-4 py-3 hover:bg-gray-100"
    >
      🔐 Vault Settings
    </button>

    <button
      onClick={logout}
      className="block w-full text-left px-4 py-3 hover:bg-red-50 text-red-600"
    >
      🚪 Logout
    </button>
  </div>
)}
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
     <main className="flex-1 p-6 bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto relative">{children}</main>
    </div>

    {/* ================= PROFILE MODAL ================= */}
    {showProfile && (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
        <div className="bg-white w-96 rounded-2xl shadow-2xl p-6 relative">
          <button
            onClick={() => setShowProfile(false)}
            className="absolute top-3 right-4 text-gray-500 hover:text-red-500 text-xl"
          >
            ×
          </button>

          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
              {user?.firstname?.charAt(0)}
              {user?.lastname?.charAt(0)}
            </div>

            <h2 className="text-xl font-semibold">{fullName}</h2>

            <span className="px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-600">
              {roleLabel}
            </span>
          </div>

          <div className="my-5 border-t"></div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Vault Status</span>
              <span className={`font-medium ${vaultLocked ? "text-red-500" : "text-green-500"}`}>
                {vaultLocked ? "Locked" : "Unlocked"}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>
    )}

    {/* ================= VAULT MODAL ================= */}
    {vaultModal && (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div className="bg-white p-6 rounded-2xl w-80 shadow-2xl animate-scaleIn relative">    
  <button
  onClick={() => setVaultModal(false)}
  className="absolute top-3 right-4 text-gray-500 hover:text-red-500 text-xl"
>
  ×
</button>
   <h2 className="font-semibold mb-3">
            {vaultRequiresSetup ? "Create Vault Key" : "Vault Settings"}
          </h2>

          <input
            type="password"
            placeholder={vaultRequiresSetup ? "Enter new encryption key" : "Enter encryption key"}
            value={vaultKeyInput}
            onChange={(e) => setVaultKeyInput(e.target.value)}
            className="w-full border p-2 rounded mb-3"
          />

          <button
            onClick={handleLockUnlock}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-2 rounded-lg hover:scale-[1.02] transition">
            {vaultRequiresSetup
              ? "Create Key"
              : vaultLocked
              ? "Unlock Vault"
              : "Lock Vault"}
          </button>
        </div>
      </div>
    )}
    </div>
  );
};

export default DashboardLayout;