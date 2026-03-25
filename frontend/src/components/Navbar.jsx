// src/components/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { FaUserCircle } from "react-icons/fa";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center bg-indigo-600 text-white px-6 py-4 shadow relative">
      {/* Heading - 75% */}
      <div className="flex-[3] text-2xl font-bold">
        DocVault
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* User Dropdown - 25% */}
      <div className="flex-[1] flex justify-end relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-700 rounded hover:bg-indigo-800 focus:outline-none transition"
        >
          <FaUserCircle className="text-xl" />
          {user?.firstname || "Admin"}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow-lg z-50 animate-fade-in">
            <button
              onClick={() => alert("Profile clicked")}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
            >
              Profile
            </button>
            <button
              onClick={logout}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Optional Tailwind animation */}
      <style>
        {`
          .animate-fade-in {
            animation: fadeIn 0.2s ease-out forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default Navbar;