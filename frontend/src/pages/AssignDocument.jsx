import { useEffect, useState } from "react";
import API from "../api/API";
import DashboardLayout from "../Layouts/DashboardLayout";
import { FaEye, FaDownload, FaEdit } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";

const AssignDocument = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);

  // Fetch users and current document assignments
  const fetchUsersAndAssignments = async () => {
    try {
      setLoading(true);

      const usersRes = await API.get("/users");
      const docRes = await API.get(`/documents/${documentId}`);

      const usersData = usersRes.data || [];
      const document = docRes.data; // backend sends doc with assignedTo
      const assignedTo = Array.isArray(document.assignedTo) ? document.assignedTo : [];

      const initialAssignments = {};

      usersData.forEach((user) => {
        const userIdStr = user._id.toString();

        // Find assigned entry for this user
        const assignedEntry = assignedTo.find((a) => {
          if (!a.userId) return false;
          const assignedUserId =
            typeof a.userId === "object"
              ? a.userId._id?.toString()
              : a.userId.toString();
          return assignedUserId === userIdStr;
        });

        initialAssignments[userIdStr] = {
          view: !!assignedEntry?.permissions?.view,
          download: !!assignedEntry?.permissions?.download,
          update: !!assignedEntry?.permissions?.update,
        };
      });

      setUsers(usersData);
      setAssignments(initialAssignments);
    } catch (err) {
      console.error("Assign fetch error:", err);
      alert("Failed to fetch users or document");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) fetchUsersAndAssignments();
  }, [documentId]);

  const handleCheckboxChange = (userId, perm) => {
    setAssignments((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [perm]: !prev[userId][perm] },
    }));
  };

  const handleSave = async () => {
    try {
      const payload = Object.entries(assignments).map(([userId, perms]) => ({
        userId,
        permissions: {
          view: perms.view,
          download: perms.download,
          update: perms.update,
        },
      }));


      await API.post(`/documents/${documentId}/assign`, {
  assignments: payload,
  sendEmail, // ✅ important
});

      alert("✅ Assignments updated");
      navigate("/categories"); // redirect back after save
    } catch (err) {
      console.error("Assignment save error:", err);
      alert("Assignment failed");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
  <DashboardLayout>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 rounded-3xl">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
          Assign Document
        </h2>

        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition shadow-sm"
        >
          ← Back
        </button>
      </div>

      {/* USERS LIST */}
      <div className="bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg border border-blue-100 max-h-[75vh] overflow-y-auto">

        {users.map((user) => {
          const userId = user._id.toString();
          const perms = assignments[userId] || {};

          return (
            <div
              key={userId}
              className="group p-5 mb-5 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1"
            >
              {/* USER INFO */}
              <p className="font-semibold text-gray-800">
                {user.firstname} {user.lastname}
              </p>
              <p className="text-sm text-gray-500">
                {user.email}
              </p>

              {/* CHECKBOXES */}
              <div className="flex gap-8 mt-4">
                {["view", "download", "update"].map((p) => (
                  <label
                    key={p}
                    className="flex items-center gap-2 capitalize text-gray-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!perms[p]}
                      onChange={() => handleCheckboxChange(userId, p)}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    {p}
                  </label>
                ))}
              </div>

              {/* ICONS (Dashboard style) */}
              <div className="flex gap-5 mt-5 text-lg">

                {perms.view && (
                  <FaEye
                    title="View"
                    className="text-blue-500 transition transform hover:scale-110 hover:text-blue-700"
                  />
                )}

                {perms.download && (
                  <FaDownload
                    title="Download"
                    className="text-green-500 transition transform hover:scale-110 hover:text-green-700"
                  />
                )}

                {perms.update && (
                  <FaEdit
                    title="Update"
                    className="text-yellow-500 transition transform hover:scale-110 hover:text-yellow-600"
                  />
                )}

              </div>
            </div>
          );
        })}
      </div>
{/* ACTION BAR */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white/80 backdrop-blur-lg p-4 rounded-2xl shadow-md border border-blue-100">

  {/* EMAIL TOGGLE */}
  <div className="flex items-center gap-3">
    
    <div
      onClick={() => setSendEmail(!sendEmail)}
      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${
        sendEmail ? "bg-indigo-600" : "bg-gray-300"
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
          sendEmail ? "translate-x-6" : ""
        }`}
      />
    </div>

    <span className="text-gray-700 font-medium">
      Send Email Notification
    </span>
  </div>

  {/* SAVE BUTTON */}
  <button
    onClick={handleSave}
    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition"
  >
    Save Assignment
  </button>

</div>

    </div>
  </DashboardLayout>
);
};

export default AssignDocument;