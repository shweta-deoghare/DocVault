// src/components/MainLayout.jsx
import React from "react";

const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Sidebar</h2>
        <ul className="flex flex-col gap-2">
          <li>Dashboard</li>
          <li>Categories</li>
          <li>Upload</li>
          <li>Master</li>
        </ul>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-100 overflow-auto">{children}</main>
    </div>
  );
};

export default MainLayout;