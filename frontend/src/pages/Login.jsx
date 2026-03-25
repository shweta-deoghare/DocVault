import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FaShieldAlt, FaLock } from "react-icons/fa";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Enter both email and password");
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-blue-900 px-4">
      
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-5"
      >
        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="bg-blue-900 p-3 rounded-full shadow-md">
            <FaShieldAlt className="text-white text-xl" />
          </div>

          <h2 className="text-2xl font-bold text-blue-900">
            DocVault
          </h2>

          <p className="text-sm text-gray-500">
            Secure Document Management System
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="bg-red-50 border border-red-200 text-red-600 text-sm p-2 rounded text-center">
            {error}
          </p>
        )}

        {/* EMAIL */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600 font-medium">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
            required
          />
        </div>

        {/* PASSWORD */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-sm text-gray-600 font-medium">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 pr-16"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-sm text-blue-900 hover:text-blue-700"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="mt-3 bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition shadow-md disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-2">
          <FaLock className="text-blue-900" />
          <span>Protected by Vault Encryption</span>
        </div>
      </form>
    </div>
  );
};

export default Login;