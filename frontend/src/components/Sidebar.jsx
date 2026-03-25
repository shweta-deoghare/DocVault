import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();

  if (!user) return null; // wait until user loads

  const links = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Categories", path: "/categories" },
    { name: "Upload", path: "/upload" },
    { name: "Master", path: "/master" }, // always visible
  ];

  return (
    <div className="w-64 bg-white shadow h-screen flex flex-col p-4">
      {links.map((link) => (
        <NavLink
          key={link.name}
          to={link.path}
          className={({ isActive }) =>
            `py-2 px-4 rounded mb-2 hover:bg-indigo-100 ${
              isActive ? "bg-indigo-200 font-bold" : ""
            }`
          }
        >
          {link.name}
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;