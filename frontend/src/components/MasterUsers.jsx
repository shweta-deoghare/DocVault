import { useEffect, useState } from "react";
import API from "../api/API";
import { FaTrash, FaEdit } from "react-icons/fa";

const MasterUsers = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const [vaultLocked, setVaultLocked] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    role: "user",
  });

  // ✅ Admin check (case-insensitive)
  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  useEffect(() => {
    fetchUsers();
    fetchVaultStatus();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
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

  const clearForm = () => {
    setFirstname("");
    setLastname("");
    setEmail("");
    setPassword("");
    setRole("user");
  };

  // ================= ADD USER =================
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!firstname || !lastname || !email || !password) {
      return alert("Fill all fields");
    }

    if (vaultLocked) {
      setPendingAction(() => async (key) => {
        await API.post(
          "/users",
          { firstname, lastname, email, password, role },
          { headers: { vaultkey: key } }
        );
        alert("User added ✅");
        clearForm();
        fetchUsers();
      });
      setShowKeyModal(true);
      return;
    }

    try {
      await API.post("/users", { firstname, lastname, email, password, role });
      alert("User added ✅");
      clearForm();
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Add failed");
    }
  };

  // ================= DELETE USER =================
  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete user?")) return;

    if (vaultLocked) {
      setPendingAction(() => async (key) => {
        await API.delete(`/users/${id}`, { headers: { vaultkey: key } });
        setUsers((prev) => prev.filter((u) => u._id !== id));
        alert("User deleted ✅");
      });
      setShowKeyModal(true);
      return;
    }

    try {
      await API.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      alert("User deleted ✅");
    } catch {
      alert("Delete failed");
    }
  };

  // ================= EDIT USER =================
  const handleEditClick = (user) => {
    if (!isAdmin) return;
    setEditingUser(user);
    setEditForm({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    });
  };

  const handleUpdateUser = async () => {
    if (!isAdmin) return;

    if (vaultLocked) {
      setPendingAction(() => async (key) => {
        await API.put(`/users/${editingUser._id}`, editForm, { headers: { vaultkey: key } });
        setEditingUser(null);
        fetchUsers();
        alert("User updated ✅");
      });
      setShowKeyModal(true);
      return;
    }

    try {
      await API.put(`/users/${editingUser._id}`, editForm);
      setEditingUser(null);
      fetchUsers();
      alert("User updated ✅");
    } catch {
      alert("Update failed");
    }
  };

  return (
    <div className="space-y-6 relative">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-800">User Management</h3>
        <span className="text-sm px-3 py-1 rounded-full bg-indigo-100 text-indigo-600">
          {users.length} Users
        </span>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* FORM */}
        <div>
          <form
            onSubmit={handleAddUser}
            className="bg-white p-8 rounded-3xl shadow-md border border-indigo-100 h-fit space-y-4 relative"
          >
            <input placeholder="First Name" value={firstname} onChange={(e) => setFirstname(e.target.value)} className="w-full p-3 border rounded-xl" disabled={!isAdmin} />
            <input placeholder="Last Name" value={lastname} onChange={(e) => setLastname(e.target.value)} className="w-full p-3 border rounded-xl" disabled={!isAdmin} />
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-xl" disabled={!isAdmin} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-xl" disabled={!isAdmin} />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-3 border rounded-xl" disabled={!isAdmin}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <div className={`text-sm px-3 py-2 rounded-xl ${vaultLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
              {vaultLocked ? "Vault Locked 🔒" : "Vault Unlocked 🔓"}
            </div>

            <button className={`w-full py-3 rounded-xl shadow-md text-white font-medium ${isAdmin ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-gray-400 cursor-not-allowed"}`} disabled={!isAdmin}>
              Add User
            </button>

            {/* Overlay for non-admins */}
            {!isAdmin && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
                <span className="text-gray-600 font-semibold text-lg">Admins only</span>
              </div>
            )}
          </form>
        </div>

        {/* LIST */}
        <div className="bg-white p-6 rounded-3xl shadow-md border border-indigo-100 max-h-[600px] overflow-y-auto relative">
          <h4 className="text-lg font-semibold mb-4">All Users</h4>

          <div className="space-y-3">
            {users.map((u) => (
              <div key={u._id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50 relative">
                <div>
                  <p className="font-medium">{u.firstname} {u.lastname}</p>
                  <p className="text-sm text-gray-500">{u.email} • {u.role}</p>
                </div>

                <div className="flex gap-4">
                  <FaEdit className={`cursor-pointer text-yellow-500 ${!isAdmin ? "opacity-50" : ""}`} onClick={() => isAdmin && handleEditClick(u)} />
                  <FaTrash className={`cursor-pointer text-red-500 ${!isAdmin ? "opacity-50" : ""}`} onClick={() => isAdmin && handleDelete(u._id)} />
                </div>

                {!isAdmin && <div className="absolute inset-0 bg-white/30 rounded-xl"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-6">
          <div className="bg-white p-6 rounded-2xl w-96 mt-20 space-y-3">
            <input value={editForm.firstname} onChange={(e) => setEditForm({ ...editForm, firstname: e.target.value })} className="w-full p-2 border rounded" disabled={!isAdmin} />
            <input value={editForm.lastname} onChange={(e) => setEditForm({ ...editForm, lastname: e.target.value })} className="w-full p-2 border rounded" disabled={!isAdmin} />
            <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full p-2 border rounded" disabled={!isAdmin} />

            <button onClick={handleUpdateUser} className={`bg-indigo-600 text-white px-4 py-2 rounded w-full ${!isAdmin ? "opacity-50 cursor-not-allowed" : ""}`} disabled={!isAdmin}>
              Update
            </button>
          </div>
        </div>
      )}

      {/* VAULT KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-3xl w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">🔐 Enter Encryption Key</h3>

            <input
              type="password"
              placeholder="Enter key"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              className="w-full p-3 border rounded-xl mb-4 focus:ring-2 focus:ring-indigo-300"
            />

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await pendingAction(encryptionKey);
                    setShowKeyModal(false);
                    setEncryptionKey("");
                  } catch {
                    alert("Invalid key");
                  }
                }}
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

export default MasterUsers;