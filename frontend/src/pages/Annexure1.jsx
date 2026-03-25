import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../Layouts/DashboardLayout";
import API from "../api/API";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";

const Annexure1 = () => {
  const { userId } = useParams();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= MASTER SHEET AUTO FILL =================
  useEffect(() => {
  if (!userId) return;

  console.log("USER ID:", userId);

  const fetchUserData = async () => {
    try {
      const res = await API.get(`/master-sheet/${userId}`);

      const user = res.data;

      setFormData({
        ...user.masterSheetData, // ✅ spread only masterSheetData
        companyName: user.companyName, // keep companyName if separate
      });

    } catch (err) {
      console.log("Error fetching user data", err);
    }
  };

  fetchUserData();
}, [userId]);
  // ================= EXCEL IMPORT =================
  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
      });

      if (jsonData.length > 0) {
        const excelData = jsonData[0];

        setFormData((prev) => {
          const updated = { ...prev };

          Object.keys(excelData).forEach((key) => {
            if (!updated[key]) {
              updated[key] = excelData[key];
            }
          });

          return updated;
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // ================= GENERATE FUNCTION =================
  const handleGenerate = async (type) => {
    try {
      setLoading(true);

      const response = await API.post(`/annexure1/${type}`, formData);
      const { fileName } = response.data;

      window.open(
        `${API.defaults.baseURL}/annexure1/download/${fileName}`,
        "_blank"
      );

      setLoading(false);
    } catch (error) {
      console.error("Generation failed", error);
      setLoading(false);
      alert("Error generating document");
    }
  };

  const Input = ({ label, name }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-8 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-3">
        <h3 className="text-white text-md font-semibold">{title}</h3>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* HEADER */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 px-6 py-6">
            <div>
              <h2 className="text-3xl font-bold text-blue-800">
                Annexure 1 Form
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Fill the Annexure 1 form and export in required format
              </p>
            </div>

            {/* GREEN UPLOAD BUTTON */}
            {/* GREEN UPLOAD BUTTON */}
<label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl cursor-pointer shadow-md transition">
  <Upload size={16} />
  <span>Upload Excel</span>
  <input
    type="file"
    accept=".xlsx, .xls"
    onChange={handleExcelImport}
    className="hidden"
  />
</label>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-700 to-blue-500 rounded-b-2xl"></div>
        </div>

        {/* ================= FORM SECTIONS ================= */}

        <Section title="1. Name of EOSP / EOIP">
          <Input label="Name of EOSP/EOIP" name="companyName" />
        </Section>

        <Section title="2. Address of EOSP / EOIP">
          <Input label="Address" name="address" />
          <Input label="City" name="city" />
          <Input label="Taluka" name="taluka" />
          <Input label="District" name="district" />
          <Input label="PIN" name="pincode" />
        </Section>

        <Section title="3. Implementing Agency Information">
          <Input label="IA Name" name="iaName" />
          <Input label="Registration No." name="iaRegNo" />
          <Input label="PAN No." name="panNo" />
          <Input label="Authorized Person" name="authorizedPerson" />
        </Section>

        <Section title="4. Project Details">
          <Input label="Project Name" name="projectName" />
          <Input label="Facility Details" name="facilityDetails" />
          <Input label="Services Offered" name="servicesOffered" />
        </Section>

        {/* 5 LAND DETAILS */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            5. Land Details
          </h3>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Input
              label="Total Land Area of Proposed EOSP/EOIP (Ha.)"
              name="totalLandArea"
            />
            <Input
              label="Distance from nearest Sea Port/Airport/Rail/Road"
              name="distance"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="border px-3 py-2">Sr. No.</th>
                  <th className="border px-3 py-2">Village / City / Town</th>
                  <th className="border px-3 py-2">
                    Survey No. / Block No. / FP No.
                  </th>
                  <th className="border px-3 py-2">Area (Ha.)</th>
                  <th className="border px-3 py-2">
                    Purchased / To be Purchased
                  </th>
                  <th className="border px-3 py-2">
                    Agriculture / Industrial NA
                  </th>
                </tr>
              </thead>

              <tbody>
                {[1, 2, 3].map((num) => (
                  <tr key={num}>
                    <td className="border px-2 py-2 text-center">{num}</td>

                    {[
                      "village",
                      "survey",
                      "area",
                      "purchaseStatus",
                      "landStatus",
                    ].map((field) => (
                      <td key={field} className="border px-2 py-2">
                        <input
                          type="text"
                          name={`${field}_${num}`}
                          value={formData[`${field}_${num}`] || ""}
                          onChange={handleChange}
                          className="w-full outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                <tr className="bg-gray-100 font-semibold">
                  <td colSpan="3" className="border px-3 py-2 text-right">
                    Total
                  </td>
                  <td className="border px-2 py-2">
                    <input
                      type="text"
                      name="totalArea"
                      value={formData.totalArea || ""}
                      onChange={handleChange}
                      className="w-full outline-none"
                    />
                  </td>
                  <td colSpan="2" className="border"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 6 */}
        <Section title="6. Estimation of Project Cost (Rs. in Lakhs)">
          <Input label="Land" name="costLand" />
          <Input label="Land Development" name="costLandDev" />
          <Input label="New Buildings" name="costBuildings" />
          <Input label="Internal Roads" name="costRoads" />
          <Input label="Substation" name="costSubstation" />
          <Input label="Electricity Network" name="costElectricity" />
          <Input label="Water Distribution" name="costWater" />
          <Input label="Sewage & Drainage" name="costSewage" />
          <Input label="Communication Facilities" name="costCommunication" />
          <Input label="Street Lights" name="costStreetLights" />
          <Input label="Common Parking" name="costParking" />
          <Input label="Fire Safety" name="costFire" />
          <Input label="Other Construction" name="costOtherConstruction" />
          <Input label="Plant & Machinery" name="costPlant" />
          <Input label="Installation Costs" name="costInstallation" />
          <Input label="Tools & Equipment" name="costTools" />
          <Input label="Other Expenditures" name="otherExpenditure" />
        </Section>

        {/* 7 */}
        <Section title="7. Means of Finance">
          <Input label="Developer Contribution" name="financeDeveloper" />
          <Input label="Internal Resources" name="financeInternal" />
          <Input label="Term Loan" name="financeLoan" />
          <Input label="Govt Subsidy" name="financeSubsidy" />
          <Input label="Other" name="financeOther" />
        </Section>

        {/* 8 */}
        <Section title="8. Power Requirement">
          <Input label="Power Requirement (KVA)" name="powerRequirement" />
          <Input label="Power Source" name="powerSource" />
        </Section>

        {/* 9 */}
        <Section title="9. Water Requirement">
          <Input label="Water Requirement (Litres/Day)" name="waterRequirement" />
          <Input label="Water Source" name="waterSource" />
        </Section>

        {/* 10 */}
        <Section title="10. Plots, Investment & Employment">
          <Input label="Total Plots" name="totalPlots" />
          <Input label="Total Employment" name="totalEmployment" />
          <Input label="Total Investment (Lakhs)" name="totalInvestment" />
        </Section>

        {/* 11 */}
        <Section title="11. Govt Incentives Applied">
          <Input label="Details" name="govtIncentiveDetails" />
        </Section>

        {/* 12 */}
        <Section title="12. Export Potential (%)">
          <Input label="Export Potential %" name="exportPotential" />
        </Section>

        {/* Declaration */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            Declaration
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            I hereby declare that all information provided in this application
            is true and accurate to the best of my knowledge.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Signature" name="signature" />
            <Input label="Date" name="date" />
          </div>
        </div>

        {/* Generate Button */}
       <div className="flex flex-wrap justify-center gap-6 mt-12 mb-12">

          <button
            onClick={() => handleGenerate("pdf")}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl shadow-md"
          >
            {loading ? "Generating..." : "Generate PDF"}
          </button>

          <button
            onClick={() => handleGenerate("word")}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-md"
          >
            Export Word
          </button>

          <button
            onClick={() => handleGenerate("excel")}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl shadow-md"
          >
            Export Excel
          </button>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default Annexure1;