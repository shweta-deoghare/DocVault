// src/components/Notifications.jsx
import React, { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import API from "../api/API";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch notifications for logged-in user
  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications"); // backend route
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle click on a notification
  const handleClickNotification = async (notification) => {
    try {
      // Mark as read
      await API.put(`/notifications/${notification._id}/read`);
      // Navigate to link
      navigate(notification.link);
      // Refresh notifications
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Count of unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        className="relative text-xl p-2 hover:text-blue-600"
        onClick={() => setOpen(!open)}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <h3 className="font-bold p-2 border-b">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="p-2 text-gray-500">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`p-2 border-b cursor-pointer hover:bg-gray-100 ${
                  !n.read ? "bg-gray-200 font-semibold" : ""
                }`}
                onClick={() => handleClickNotification(n)}
              >
                <p>{n.message}</p>
                <p className="text-xs text-gray-500">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;