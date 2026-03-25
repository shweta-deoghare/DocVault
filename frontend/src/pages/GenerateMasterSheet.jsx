import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../Layouts/DashboardLayout";
import API from "../api/API"; // Axios instance
import ImportExcel from "../components/ImportExcel";

const GenerateMasterSheet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    financialYear: "",
    address: "",
    establishmentDate: "",
    registrationNumber: "",
    registeredAddress: "",
    city: "",
    state: "",
    pincode: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    mpcb: "",
    msmeType: "",
    udyamNumber: "",
    bankName: "",
    branchAddress: "",
    ifsc: "",
    accountNumber: "",
    factoryAddress: "",
    exhibitionName: "",
    exhibitionAddress: "",
    exportProducts: "",
    exportCountries: "",
    exportStartDate: "",
    transportation: "",
    packaging: "",
    handling: "",
    others: "",
    year1: "",
    year2: "",
    year3: "",
    fob1: "",
    fob2: "",
    fob3: "",
    turnover1: "",
    turnover2: "",
    turnover3: "",
    certificateNo: "",
    certificateDate: "",
    companyRegNo: "",
    iecNo: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await API.post("/master-sheet/create", formData);
    alert("User created successfully!");
    // Navigate to Client Master section
    navigate("/documents"); // <-- updated
  } catch (err) {
    console.error("Failed to create user", err);
    alert("Failed to create user");
  } finally {
    setLoading(false);
  }
};

  const renderSection = (title, fields) => (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-8 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-3">
        <h3 className="text-white text-md font-semibold">{title}</h3>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => {
          const isDate = [
            "establishmentDate",
            "exportStartDate",
            "certificateDate",
          ].includes(field);

          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {field.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                type={isDate ? "date" : "text"}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* HEADER */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 px-6 py-6">
            <div>
              <h2 className="text-3xl font-bold text-blue-800">Create User</h2>
              <p className="text-sm text-gray-600 mt-1">
                Fill the Master Sheet form to create a new user
              </p>
            </div>

            <ImportExcel bulk={true} />
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-700 to-blue-500 rounded-b-2xl"></div>
        </div>

        <form onSubmit={handleCreateUser}>
          {renderSection("Company Information", [
            "companyName","financialYear","address","registeredAddress",
            "city","state","pincode","registrationNumber","establishmentDate",
          ])}

          {renderSection("Contact Details", [
            "contactPerson","contactNumber","email",
          ])}

          {renderSection("Bank Details", [
            "bankName","branchAddress","ifsc","accountNumber",
          ])}

          {renderSection("Export Details", [
            "exportProducts","exportCountries","exportStartDate",
          ])}

          {renderSection("Logistic Expenditure Detail (INR)", [
            "transportation","packaging","handling","others",
          ])}

          {renderSection("Certificate Information", [
            "certificateNo","certificateDate","companyRegNo","iecNo",
            "mpcb","msmeType","udyamNumber","factoryAddress",
            "exhibitionName","exhibitionAddress",
          ])}

          {renderSection("Financial Performance (Last 3 Years)", [
            "year1","fob1","turnover1",
            "year2","fob2","turnover2",
            "year3","fob3","turnover3",
          ])}

          <div className="flex justify-center mt-10">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-md transition"
            >
              {loading ? "Creating User..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default GenerateMasterSheet;