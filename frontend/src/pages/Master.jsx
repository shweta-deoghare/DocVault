// src/pages/Master.jsx
import { useState, useEffect } from "react";
import DashboardLayout from "../Layouts/DashboardLayout";
import MasterUsers from "../components/MasterUsers";
import MasterCategories from "../components/MasterCategories";
import { FaUsers, FaLayerGroup } from "react-icons/fa";

const Master = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch logged-in user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
  }, []);

  return (
    <DashboardLayout>
      {/* Container */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 rounded-3xl">

        {/* HEADER */}
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-gray-800 tracking-tight">
            Master Dashboard
          </h2>
          <p className="text-gray-500 mt-2">
            Manage users and categories with full control
          </p>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-10">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
              activeTab === "users"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                : "bg-white/80 backdrop-blur border text-gray-600 hover:bg-indigo-50"
            }`}
          >
            <FaUsers /> Users
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
              activeTab === "categories"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                : "bg-white/80 backdrop-blur border text-gray-600 hover:bg-indigo-50"
            }`}
          >
            <FaLayerGroup /> Categories
          </button>
        </div>

        {/* CONTENT */}
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-lg border border-blue-100">
          {/* ✅ Pass currentUser to MasterUsers */}
          {activeTab === "users" && currentUser && (
            <MasterUsers currentUser={currentUser} />
          )}

          {/* MasterCategories also receives currentUser */}
          {activeTab === "categories" && currentUser && (
            <MasterCategories currentUser={currentUser} />
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Master;